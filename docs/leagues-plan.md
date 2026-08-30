# Leagues: cross-game leaderboard — implementation plan

Branch: `feature/leagues`

## Goal

A persistent leaderboard across multiple games played by the same group of
players. Keep the existing "unguessable URL" model — **no logins, fully open**:
anyone with a league link can view standings, attach games, and edit players.

Additionally: add players to an existing league, and edit player names + icons.

## Guiding decisions (locked)

- **Persistence:** SQLite (single file, zero infra).
- **Access:** fully open capability URLs. A league is reachable at
  `/league/<leagueCode>`; the code is the only secret, same trust model as the
  existing 8-char game `joinCode`.
- **No auth / no accounts.**
- **Backwards compatible & additive** (per CLAUDE.md): games without a
  `leagueId` keep working exactly as today; the in-memory flow is not removed,
  it is backed by the DB.

---

## Current state (what exists today)

- **Backend** (NestJS 10, `services/backend`):
  - `AppService` stores games in an **in-memory `Map<string, Game>`** — lost on
    restart. This is the real blocker; persistence is the bulk of the work.
  - `GameGateway` (socket.io) handles `createGame`, `setGameState`,
    `getGameState`, `joinGame`, `setPlayerState`.
  - No ORM installed.
- **Frontend** (`services/frontend-vite`):
  - Routes in `main.tsx`: `/`, `/game/new`, `/game/controller/:gameCode`,
    `/game/display/:gameCode`, `/about`, `/preview`.
  - `useSocket` hook wraps all socket calls; `createGame` returns a Promise.
  - Player identity today = `player.name` (string) + `player.color` (emoji).
    `player.order` is a stable per-game display order.
  - Game end sets `state.running = false`; `currentPoints(predicted, actual)`
    already computes a player's total for a game.

---

## Data model

New tables (SQLite). IDs are unguessable random strings (reuse the existing
`generateRandomString(8)` generator, or a longer one for leagues).

```
League
  id          TEXT PRIMARY KEY      -- unguessable league code, used in URL
  name        TEXT
  createdAt   INTEGER               -- epoch ms

Player                              -- a persistent person within one league
  id          TEXT PRIMARY KEY      -- stable across games; NOT the name
  leagueId    TEXT  -> League.id
  name        TEXT                  -- editable
  color       TEXT                  -- emoji icon, editable

Game
  joinCode    TEXT PRIMARY KEY      -- unchanged
  leagueId    TEXT NULL -> League.id  -- NEW, nullable (standalone games allowed)
  data        TEXT                  -- JSON blob of the existing Game object
  createdAt   INTEGER
  finished    INTEGER (0/1)         -- derived cache of state.running === false
```

Design notes:
- **Store the whole `Game` as a JSON blob** in `Game.data`. The game shape is
  nested and churns often (settings, showCharts, mustNotAddUp, …). A JSON column
  avoids migrations every time the game object changes and keeps the socket
  contract identical. Only `joinCode`, `leagueId`, `finished` are promoted to
  real columns for querying.
- **Players are league-scoped.** A `PlayerState` inside a game still carries the
  name/color snapshot (so a finished game renders as it was played), but each
  game player also references a league `Player.id` when the game belongs to a
  league. That link is what lets us aggregate across games and survive renames.

### Linking game players to league players

Add an optional `playerId` to the frontend/back `Player` interface (additive):

```ts
interface Player {
  name: string;
  color: string;
  order?: number;
  playerId?: string;   // NEW: league Player.id when game is in a league
}
```

When a game is created against a league, each selected league player is copied
into the game's `playerStates` with `playerId` set. Standings aggregation groups
finished games by `playerId` (falling back to `name` for legacy games).

---

## Persistence choice: `better-sqlite3` + a thin repository (no TypeORM)

Rationale: the codebase has no ORM and the queries are trivial. `better-sqlite3`
is synchronous, tiny, and zero-config. Avoids dragging in TypeORM entities and
decorators for four tables.

- Add dep: `better-sqlite3` (+ `@types/better-sqlite3`).
- DB file path from env `DATABASE_PATH` (default `./data/wizard.db`), so the
  Docker deploy can mount a volume. Add `data/` to `.gitignore`.
- New `DbService` (Nest injectable): opens the connection, runs `CREATE TABLE
  IF NOT EXISTS` on boot (idempotent bootstrap migration), exposes typed
  helpers. No migration framework needed for v1.

### AppService changes (games)

Replace the `Map` with DB-backed reads/writes, keeping the same method
signatures so `GameGateway` is untouched except where noted:

- `setGameState(game)` → upsert into `Game` (serialize `data`, set `leagueId`
  from `game.leagueId`, `finished` from `!game.state.running`). On the first
  write of a league game, ensure the league's players exist.
- `getGameState(joinCode)` → read + JSON parse.
- `setPlayerState(...)` → read, mutate, write.
- Optional in-memory LRU cache in front of the DB if we want to avoid a read on
  every socket message (nice-to-have, not required for correctness).

---

## Backend API surface

Leagues are lower-frequency and request/response shaped, so use **HTTP
(controller)** rather than sockets. Add a `LeagueController` +
`LeagueService`.

```
POST   /leagues                         -> { id }             create a league
GET    /leagues/:id                     -> League + players    league detail
POST   /leagues/:id/players             -> Player             add a player
PATCH  /leagues/:id/players/:playerId   -> Player             edit name/color
DELETE /leagues/:id/players/:playerId   -> 204                remove (optional)
GET    /leagues/:id/standings           -> Standings[]        aggregated board
GET    /leagues/:id/games               -> GameSummary[]      games in league
```

`Standings[]` shape (computed server-side from finished games):

```ts
{
  playerId, name, color,
  gamesPlayed, totalPoints, wins,
  averagePoints, bestGame
}
```

Aggregation: load finished games for the league, for each game compute every
player's `currentPoints`, group by `playerId`, sum totals, count wins
(max score in that game). Reuse the existing scoring logic (share
`currentPoints` between front and back, or duplicate the tiny function
server-side).

`Game` gains `leagueId` on the socket create path: when the frontend creates a
game with a `leagueId`, it's persisted and the game shows up in the league.

---

## Frontend changes

### Types (`api/entities.ts`)
- Add `playerId?: string` to `Player`.
- Add `leagueId?: string` to `Game`.
- Add `League`, `LeaguePlayer`, `Standing` interfaces.

### API access
- Add a small REST client (`api/leagues.ts`) using `fetch` against
  `VITE_BACKEND_URL` for the league endpoints (sockets stay for games).

### Routes (`main.tsx`)
- `/league/:leagueId` — league home: standings + games list + player management.
- (Reuse existing game routes.)

### New Game page (`NewGamePage.tsx`)
Add a league mode toggle at the top:
- **No league** (default) — current behavior, standalone game.
- **New league** — enter a league name; on create, POST the league, then create
  the game with `leagueId`, then navigate to controller. Also surface the
  league link.
- **Existing league** — paste a league code (or arrive pre-filled from the
  league page's "Neues Spiel" button). Player picker shows the league's saved
  players (with icons); pick who's playing this game. Selected players are
  copied into `playerStates` with their `playerId`.

### League page (`/league/:leagueId`)
- **Standings table:** rank, icon, name, games played, total points, wins, avg.
- **Games list:** each finished/ongoing game with date, winner, link to its
  display/controller.
- **Player management:**
  - Add player (name + emoji via existing `EmojiPicker`).
  - Edit player name and icon inline (PATCH).
  - Copy league link button.
  - "Neues Spiel" button → NewGamePage in "existing league" mode with this
    league preselected.

### Reuse
- `EmojiPicker`, `PlayerCard`, `Button`, `Input` components already exist and
  cover the add/edit player UI.
- `currentPoints` already exists for per-game scoring.

---

## Backwards compatibility

- `leagueId` and `playerId` are optional everywhere → old games and the
  standalone flow are unaffected.
- The socket contract for games is unchanged (same events, same `Game` shape
  plus one optional field).
- Standings fall back to grouping by `name` when `playerId` is absent, so a
  league could even be reconstructed from legacy games if desired (not required).

---

## Build order (incremental, each step shippable)

1. **Persistence foundation**
   - Add `better-sqlite3`, `DbService`, table bootstrap, `DATABASE_PATH` env,
     `.gitignore` for `data/`.
   - Swap `AppService` game storage from `Map` to DB. Verify existing game flow
     still works end-to-end (create → play → finish).
2. **League backend**
   - `League`/`Player` tables, `LeagueService`, `LeagueController` with the
     endpoints above (create, get, add/edit player, standings, games).
   - Persist `leagueId` on game create; ensure league players exist on first
     game write.
3. **League types + REST client (frontend)**
   - `Player.playerId`, `Game.leagueId`, league interfaces, `api/leagues.ts`.
4. **League page**
   - `/league/:leagueId` route: standings + games + player management
     (add/edit name/icon).
5. **New Game integration**
   - League mode toggle (none / new / existing) + player picker for existing
     leagues; navigate and surface league link.
6. **Polish**
   - Winner/date on games list, empty states, copy-link buttons, link the final
     screen back to the league standings.

## Deploy note

The SQLite file must live on a mounted volume in the container
(`DATABASE_PATH`), otherwise standings reset on redeploy. Update the Docker/
compose/`deploy.sh` to mount `./data`.

## Open questions / deferred

- Player removal semantics when they already have games (soft-hide vs hard
  delete). v1: allow delete only if the player has no games, else just hide from
  the picker.
- Optional later: per-league game settings defaults (e.g. always "Darf nicht
  aufgehen").
- Optional later: view/admin split URLs if fully-open ever proves too loose.
