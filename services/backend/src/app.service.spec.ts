import { AppService } from './app.service';
import { DbService, GameRow, PlayerRow } from './db.service';
import { Game, PlayerState } from './app.entity';

// In-memory stand-in for the DbService methods AppService uses.
class FakeDb {
  games = new Map<string, GameRow>();
  players = new Map<string, PlayerRow>();

  getGame(joinCode: string) {
    return this.games.get(joinCode);
  }
  upsertGame(row: GameRow) {
    this.games.set(row.joinCode, row);
  }
  getAllGames() {
    return [...this.games.values()];
  }
  getPlayer(id: string) {
    return this.players.get(id);
  }
  insertPlayer(row: PlayerRow) {
    this.players.set(row.id, row);
  }
}

function makeGame(props: {
  joinCode?: string;
  leagueId?: string;
  running?: boolean;
  players?: { name: string; playerId?: string }[];
}): Game {
  const {
    joinCode = 'G1',
    leagueId,
    running = true,
    players = [{ name: 'Ann' }],
  } = props;
  const playerStates: PlayerState[] = players.map((p, i) => ({
    player: { name: p.name, color: '🎩', order: i, playerId: p.playerId },
    points: { predicted: [], actual: [] },
  }));
  return {
    joinCode,
    leagueId,
    state: { startTime: 0, currentRound: 1, running, playerStates },
  };
}

function makeService(): { service: AppService; db: FakeDb } {
  const db = new FakeDb();
  const service = new AppService(db as unknown as DbService);
  return { service, db };
}

describe('AppService', () => {
  describe('setGameState / getGameState', () => {
    it('round-trips a game through storage', () => {
      const { service } = makeService();
      const game = makeGame({ joinCode: 'ABC' });
      service.setGameState(game);
      expect(service.getGameState('ABC')).toEqual(game);
    });

    it('returns undefined for an unknown game', () => {
      const { service } = makeService();
      expect(service.getGameState('missing')).toBeUndefined();
    });

    it('marks a running game unfinished and a stopped game finished', () => {
      const { service, db } = makeService();
      service.setGameState(makeGame({ joinCode: 'R', running: true }));
      service.setGameState(makeGame({ joinCode: 'F', running: false }));
      expect(db.getGame('R')!.finished).toBe(0);
      expect(db.getGame('F')!.finished).toBe(1);
    });

    it('preserves the original createdAt across updates', () => {
      const { service, db } = makeService();
      const game = makeGame({ joinCode: 'G1' });
      service.setGameState(game);
      const firstCreatedAt = db.getGame('G1')!.createdAt;

      // Update the same game later; createdAt must not change.
      service.setGameState({ ...game, name: 'renamed' });
      expect(db.getGame('G1')!.createdAt).toBe(firstCreatedAt);
    });
  });

  describe('ensureLeaguePlayers', () => {
    it('persists referenced league players that do not yet exist', () => {
      const { service, db } = makeService();
      service.setGameState(
        makeGame({
          leagueId: 'L1',
          players: [{ name: 'Ann', playerId: 'a' }],
        }),
      );
      expect(db.getPlayer('a')).toEqual({
        id: 'a',
        leagueId: 'L1',
        name: 'Ann',
        color: '🎩',
      });
    });

    it('does nothing for a standalone (league-less) game', () => {
      const { service, db } = makeService();
      service.setGameState(
        makeGame({ players: [{ name: 'Ann', playerId: 'a' }] }),
      );
      expect(db.getPlayer('a')).toBeUndefined();
    });

    it('does not overwrite an already-persisted player', () => {
      const { service, db } = makeService();
      db.insertPlayer({ id: 'a', leagueId: 'L1', name: 'Old', color: '🦊' });
      service.setGameState(
        makeGame({
          leagueId: 'L1',
          players: [{ name: 'NewName', playerId: 'a' }],
        }),
      );
      // Existing row is left untouched.
      expect(db.getPlayer('a')!.name).toBe('Old');
    });

    it('skips players without a playerId', () => {
      const { service, db } = makeService();
      service.setGameState(
        makeGame({ leagueId: 'L1', players: [{ name: 'Ann' }] }),
      );
      expect(db.players.size).toBe(0);
    });
  });

  describe('setPlayerState', () => {
    it('updates a player prediction array and persists it', () => {
      const { service } = makeService();
      service.setGameState(
        makeGame({ joinCode: 'G1', players: [{ name: 'Ann' }] }),
      );
      const updated = service.setPlayerState('G1', 'Ann', [1, 2, 3]);
      expect(updated!.state.playerStates[0].points.predicted).toEqual([
        1, 2, 3,
      ]);
      expect(
        service.getGameState('G1')!.state.playerStates[0].points.predicted,
      ).toEqual([1, 2, 3]);
    });

    it('returns undefined for an unknown game', () => {
      const { service } = makeService();
      expect(service.setPlayerState('missing', 'Ann', [1])).toBeUndefined();
    });
  });

  describe('getAllGameStates', () => {
    it('parses every stored game', () => {
      const { service } = makeService();
      service.setGameState(makeGame({ joinCode: 'A' }));
      service.setGameState(makeGame({ joinCode: 'B' }));
      const codes = service.getAllGameStates().map((g) => g.joinCode).sort();
      expect(codes).toEqual(['A', 'B']);
    });
  });
});
