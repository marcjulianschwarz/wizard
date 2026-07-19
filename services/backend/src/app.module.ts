import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './gateway';
import { ConfigModule } from '@nestjs/config';
import { DbService } from './db.service';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, LeagueController],
  providers: [AppService, GameGateway, DbService, LeagueService],
})
export class AppModule {}
