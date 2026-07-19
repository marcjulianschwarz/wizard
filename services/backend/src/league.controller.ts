import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LeagueService } from './league.service';

interface CreateLeagueBody {
  name: string;
}

interface AddPlayerBody {
  name: string;
  color: string;
}

interface UpdatePlayerBody {
  name?: string;
  color?: string;
}

@Controller('leagues')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Post()
  create(@Body() body: CreateLeagueBody) {
    return this.leagueService.createLeague(body.name);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.leagueService.getLeague(id);
  }

  @Post(':id/players')
  addPlayer(@Param('id') id: string, @Body() body: AddPlayerBody) {
    return this.leagueService.addPlayer(id, body.name, body.color);
  }

  @Patch(':id/players/:playerId')
  updatePlayer(
    @Param('id') id: string,
    @Param('playerId') playerId: string,
    @Body() body: UpdatePlayerBody,
  ) {
    return this.leagueService.updatePlayer(id, playerId, body);
  }

  @Delete(':id/players/:playerId')
  @HttpCode(204)
  deletePlayer(@Param('id') id: string, @Param('playerId') playerId: string) {
    this.leagueService.deletePlayer(id, playerId);
  }

  @Get(':id/standings')
  standings(@Param('id') id: string) {
    return this.leagueService.getStandings(id);
  }

  @Get(':id/games')
  games(@Param('id') id: string) {
    return this.leagueService.getGames(id);
  }

  @Delete(':id/games/:joinCode')
  @HttpCode(204)
  deleteGame(@Param('id') id: string, @Param('joinCode') joinCode: string) {
    this.leagueService.deleteGame(id, joinCode);
  }
}
