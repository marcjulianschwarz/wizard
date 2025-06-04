import { Injectable, Logger } from '@nestjs/common';
import { Game } from './app.entity';

@Injectable()
export class AppService {
  private games: Map<string, Game> = new Map();
  logger: Logger = new Logger(AppService.name);

  getAPI(): string {
    return 'Wizard API is running.';
  }

  setGameState(game: Game) {
    this.logger.log('Setting Game');
    this.logger.log(JSON.stringify(game));
    this.games.set(game.joinCode, game);
  }

  setPlayerState(joinCode: string, playerName: string, predicted: number[]) {
    const game = this.games.get(joinCode);
    const playerState = game.state.playerStates.find(
      (state) => state.player.name === playerName,
    );
    playerState.points.predicted = predicted;
    this.games.set(joinCode, game);
    return game;
  }

  getGameState(joinCode: string) {
    this.logger.log('Get Game');
    const game = this.games.get(joinCode);
    this.logger.log(JSON.stringify(game));
    return game;
  }

  getAllGameStates() {
    return Array.from(this.games.values());
  }
}
