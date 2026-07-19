import { Injectable, Logger } from '@nestjs/common';
import { Game } from './app.entity';
import { DbService, GameRow } from './db.service';

@Injectable()
export class AppService {
  logger: Logger = new Logger(AppService.name);

  constructor(private readonly db: DbService) {}

  getAPI(): string {
    return 'Wizard API is running.';
  }

  private toRow(game: Game, existing?: GameRow): GameRow {
    return {
      joinCode: game.joinCode,
      leagueId: game.leagueId ?? null,
      data: JSON.stringify(game),
      // Preserve the original createdAt on updates; stamp it on first write.
      createdAt: existing?.createdAt ?? Date.now(),
      finished: game.state.running ? 0 : 1,
    };
  }

  private ensureLeaguePlayers(game: Game) {
    if (!game.leagueId) return;
    for (const ps of game.state.playerStates) {
      const player = ps.player;
      if (!player.playerId) continue;
      if (this.db.getPlayer(player.playerId)) continue;
      // A league player referenced by the game but not yet persisted — create
      // it so standings/aggregation can resolve the id.
      this.db.insertPlayer({
        id: player.playerId,
        leagueId: game.leagueId,
        name: player.name,
        color: player.color,
      });
    }
  }

  setGameState(game: Game) {
    this.logger.log('Setting Game ' + game.joinCode);
    const existing = this.db.getGame(game.joinCode);
    this.ensureLeaguePlayers(game);
    this.db.upsertGame(this.toRow(game, existing));
  }

  setPlayerState(joinCode: string, playerName: string, predicted: number[]) {
    const game = this.getGameState(joinCode);
    if (!game) return undefined;
    const playerState = game.state.playerStates.find(
      (state) => state.player.name === playerName,
    );
    playerState.points.predicted = predicted;
    this.setGameState(game);
    return game;
  }

  getGameState(joinCode: string): Game | undefined {
    const row = this.db.getGame(joinCode);
    if (!row) return undefined;
    return JSON.parse(row.data) as Game;
  }

  getAllGameStates(): Game[] {
    return this.db.getAllGames().map((row) => JSON.parse(row.data) as Game);
  }
}
