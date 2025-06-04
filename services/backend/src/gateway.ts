import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Game } from './app.entity';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: new ConfigService().get('FRONTEND_URL'),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class GameGateway {
  @WebSocketServer() server: Server;
  logger: Logger = new Logger(GameGateway.name);

  constructor(private readonly appService: AppService) {
    this.logger.log('Init GameGateway');
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @MessageBody() joinCode: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('Client joining game ', joinCode);
    client.join(joinCode);
    const gameState = this.appService.getGameState(joinCode);
    if (gameState) {
      client.emit('gameState', gameState);
    }
  }

  @SubscribeMessage('setGameState')
  handleSetGameState(@MessageBody() game: Game) {
    this.logger.log('Game Update');
    this.appService.setGameState(game);
    this.server.to(game.joinCode).emit('gameState', game);
  }

  @SubscribeMessage('getGameState')
  handleGetGameState(
    @MessageBody() joinCode: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('Loading Game State');
    const gameState = this.appService.getGameState(joinCode);
    client.emit('gameState', gameState);
  }

  @SubscribeMessage('setPlayerState')
  handleSetPlayerState(
    @MessageBody() joinCode: string,
    @MessageBody() playerName: string,
    @MessageBody() predicted: number[],
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log('Player State Update');
    const gameState = this.appService.setPlayerState(
      joinCode,
      playerName,
      predicted,
    );
    client.emit('gameState', gameState);
  }

  @SubscribeMessage('createGame')
  handleCreateGame(
    @MessageBody() game: Game,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log('Creating new game');
      this.appService.setGameState(game);
      client.join(game.joinCode);
      client.emit('gameState', game);
      return { success: true };
    } catch (error) {
      this.logger.error('Creating game failed.');
      return { success: false, error: error.message };
    }
  }
}
