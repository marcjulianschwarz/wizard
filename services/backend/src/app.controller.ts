import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Game } from './app.entity';
import { ApiBody } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getAPI(): string {
    return this.appService.getAPI();
  }

  @Post('setGameState')
  @ApiBody({})
  setGameState(@Body() body: Game) {
    this.appService.setGameState(body);
  }

  @Get('getGameState/:joinCode')
  getGameState(@Param('joinCode') joinCode: string) {
    return this.appService.getGameState(joinCode);
  }

  @Get('getAllGameStates')
  getAllGameStates() {
    return this.appService.getAllGameStates();
  }
}
