import { NotFoundException } from '@nestjs/common';
import { LeagueService } from './league.service';
import {
  DbService,
  GameRow,
  LeagueRow,
  PlayerRow,
} from './db.service';
import { Game, PlayerState } from './app.entity';

// A minimal in-memory stand-in for DbService: only the methods LeagueService
// actually calls, backed by Maps. Lets us drive the aggregation logic without a
// real SQLite database.
class FakeDb {
  leagues = new Map<string, LeagueRow>();
  players = new Map<string, PlayerRow>();
  games = new Map<string, GameRow>();

  getLeague(id: string) {
    return this.leagues.get(id);
  }
  insertLeague(row: LeagueRow) {
    this.leagues.set(row.id, row);
  }
  getPlayer(id: string) {
    return this.players.get(id);
  }
  insertPlayer(row: PlayerRow) {
    this.players.set(row.id, row);
  }
  updatePlayer(id: string, fields: { name?: string; color?: string }) {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    const next = { ...existing, ...fields };
    this.players.set(id, next);
    return next;
  }
  deletePlayer(id: string) {
    this.players.delete(id);
  }
  getPlayersByLeague(leagueId: string) {
    return [...this.players.values()]
      .filter((p) => p.leagueId === leagueId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  getGame(joinCode: string) {
    return this.games.get(joinCode);
  }
  deleteGame(joinCode: string) {
    this.games.delete(joinCode);
  }
  getGamesByLeague(leagueId: string) {
    return [...this.games.values()].filter((g) => g.leagueId === leagueId);
  }
}

// Build a finished/running game row for a league from a compact spec.
function gameRow(props: {
  joinCode: string;
  leagueId: string | null;
  running?: boolean;
  createdAt?: number;
  players: {
    name: string;
    color?: string;
    playerId?: string;
    predicted: number[];
    actual: number[];
  }[];
}): GameRow {
  const { joinCode, leagueId, running = false, createdAt = 0, players } = props;
  const playerStates: PlayerState[] = players.map((p, i) => ({
    player: {
      name: p.name,
      color: p.color ?? '🎩',
      order: i,
      playerId: p.playerId,
    },
    points: { predicted: p.predicted, actual: p.actual },
  }));
  const game: Game = {
    joinCode,
    leagueId: leagueId ?? undefined,
    state: {
      startTime: createdAt,
      currentRound: 1,
      running,
      playerStates,
    },
  };
  return {
    joinCode,
    leagueId,
    data: JSON.stringify(game),
    createdAt,
    finished: running ? 0 : 1,
  };
}

function makeService(): { service: LeagueService; db: FakeDb } {
  const db = new FakeDb();
  const service = new LeagueService(db as unknown as DbService);
  return { service, db };
}

describe('LeagueService', () => {
  describe('createLeague / getLeague', () => {
    it('creates a league and reads it back with its players', () => {
      const { service, db } = makeService();
      const { id } = service.createLeague('Skat Nacht');
      db.insertPlayer({ id: 'p1', leagueId: id, name: 'Ann', color: '🦊' });
      const league = service.getLeague(id);
      expect(league.name).toBe('Skat Nacht');
      expect(league.players).toEqual([
        { id: 'p1', leagueId: id, name: 'Ann', color: '🦊' },
      ]);
    });

    it('throws NotFound for an unknown league', () => {
      const { service } = makeService();
      expect(() => service.getLeague('nope')).toThrow(NotFoundException);
    });
  });

  describe('addPlayer / updatePlayer / deletePlayer', () => {
    it('rejects adding a player to a missing league', () => {
      const { service } = makeService();
      expect(() => service.addPlayer('nope', 'Ann', '🦊')).toThrow(
        NotFoundException,
      );
    });

    it('rejects updating a player from a different league', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.insertLeague({ id: 'L2', name: 'B', createdAt: 0 });
      db.insertPlayer({ id: 'p1', leagueId: 'L2', name: 'Ann', color: '🦊' });
      expect(() =>
        service.updatePlayer('L1', 'p1', { name: 'X' }),
      ).toThrow(NotFoundException);
    });

    it('updates a player in its own league', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.insertPlayer({ id: 'p1', leagueId: 'L1', name: 'Ann', color: '🦊' });
      const updated = service.updatePlayer('L1', 'p1', { color: '🐼' });
      expect(updated).toEqual({
        id: 'p1',
        leagueId: 'L1',
        name: 'Ann',
        color: '🐼',
      });
    });
  });

  describe('deleteGame', () => {
    it('rejects deleting a game from a different league', () => {
      const { service, db } = makeService();
      db.games.set(
        'G1',
        gameRow({ joinCode: 'G1', leagueId: 'OTHER', players: [] }),
      );
      expect(() => service.deleteGame('L1', 'G1')).toThrow(NotFoundException);
    });

    it('deletes a game belonging to the league', () => {
      const { service, db } = makeService();
      db.games.set(
        'G1',
        gameRow({ joinCode: 'G1', leagueId: 'L1', players: [] }),
      );
      service.deleteGame('L1', 'G1');
      expect(db.getGame('G1')).toBeUndefined();
    });
  });

  describe('getGames', () => {
    it('summarises each game with ranked scores and the winner', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.games.set(
        'G1',
        gameRow({
          joinCode: 'G1',
          leagueId: 'L1',
          createdAt: 123,
          players: [
            // Ann: hit 2 (+40). Bob: missed by 1 (-10).
            { name: 'Ann', predicted: [2], actual: [2] },
            { name: 'Bob', predicted: [1], actual: [0] },
          ],
        }),
      );
      const [summary] = service.getGames('L1');
      expect(summary.joinCode).toBe('G1');
      expect(summary.createdAt).toBe(123);
      expect(summary.finished).toBe(true);
      expect(summary.playerCount).toBe(2);
      expect(summary.scores).toEqual([
        { name: 'Ann', color: '🎩', points: 40 },
        { name: 'Bob', color: '🎩', points: -10 },
      ]);
      expect(summary.winner).toEqual({ name: 'Ann', color: '🎩', points: 40 });
    });

    it('throws NotFound when the league does not exist', () => {
      const { service } = makeService();
      expect(() => service.getGames('nope')).toThrow(NotFoundException);
    });
  });

  describe('getStandings', () => {
    it('ignores unfinished games', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.games.set(
        'G1',
        gameRow({
          joinCode: 'G1',
          leagueId: 'L1',
          running: true,
          players: [{ name: 'Ann', predicted: [2], actual: [2] }],
        }),
      );
      expect(service.getStandings('L1')).toEqual([]);
    });

    it('aggregates points, wins, average and best game across games by playerId', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      // Game 1: Ann +40 (win), Bob -10.
      db.games.set(
        'G1',
        gameRow({
          joinCode: 'G1',
          leagueId: 'L1',
          players: [
            { name: 'Ann', playerId: 'a', predicted: [2], actual: [2] },
            { name: 'Bob', playerId: 'b', predicted: [1], actual: [0] },
          ],
        }),
      );
      // Game 2: Ann +20, Bob +50 (win).
      db.games.set(
        'G2',
        gameRow({
          joinCode: 'G2',
          leagueId: 'L1',
          players: [
            { name: 'Ann', playerId: 'a', predicted: [0], actual: [0] },
            { name: 'Bob', playerId: 'b', predicted: [3], actual: [3] },
          ],
        }),
      );

      const standings = service.getStandings('L1');
      // Sorted by totalPoints desc: Ann 60, Bob 40.
      expect(standings.map((s) => s.playerId)).toEqual(['a', 'b']);
      const ann = standings.find((s) => s.playerId === 'a')!;
      const bob = standings.find((s) => s.playerId === 'b')!;

      expect(ann.gamesPlayed).toBe(2);
      expect(ann.totalPoints).toBe(60);
      expect(ann.wins).toBe(1);
      expect(ann.averagePoints).toBe(30);
      expect(ann.bestGame).toBe(40);

      expect(bob.gamesPlayed).toBe(2);
      expect(bob.totalPoints).toBe(40);
      expect(bob.wins).toBe(1);
      expect(bob.averagePoints).toBe(20);
      expect(bob.bestGame).toBe(50);
    });

    it('counts a tie as a win for every top-scoring player', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.games.set(
        'G1',
        gameRow({
          joinCode: 'G1',
          leagueId: 'L1',
          players: [
            { name: 'Ann', playerId: 'a', predicted: [2], actual: [2] },
            { name: 'Bob', playerId: 'b', predicted: [2], actual: [2] },
          ],
        }),
      );
      const standings = service.getStandings('L1');
      expect(standings.every((s) => s.wins === 1)).toBe(true);
    });

    it('falls back to name grouping for legacy games without a playerId', () => {
      const { service, db } = makeService();
      db.insertLeague({ id: 'L1', name: 'A', createdAt: 0 });
      db.games.set(
        'G1',
        gameRow({
          joinCode: 'G1',
          leagueId: 'L1',
          players: [{ name: 'Ann', predicted: [2], actual: [2] }],
        }),
      );
      db.games.set(
        'G2',
        gameRow({
          joinCode: 'G2',
          leagueId: 'L1',
          players: [{ name: 'Ann', predicted: [0], actual: [0] }],
        }),
      );
      const standings = service.getStandings('L1');
      expect(standings).toHaveLength(1);
      expect(standings[0].gamesPlayed).toBe(2);
      expect(standings[0].totalPoints).toBe(60);
      expect(standings[0].playerId).toBe('');
    });
  });
});
