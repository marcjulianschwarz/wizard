import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Game,
  GameSummary,
  LeagueDetail,
  LeaguePlayer,
  Standing,
} from './app.entity';
import { DbService, PlayerRow } from './db.service';
import { currentPoints, generateRandomString } from './scoring';

function toLeaguePlayer(row: PlayerRow): LeaguePlayer {
  return {
    id: row.id,
    leagueId: row.leagueId,
    name: row.name,
    color: row.color,
  };
}

@Injectable()
export class LeagueService {
  constructor(private readonly db: DbService) {}

  createLeague(name: string): { id: string } {
    const id = generateRandomString(10);
    this.db.insertLeague({ id, name, createdAt: Date.now() });
    return { id };
  }

  getLeague(id: string): LeagueDetail {
    const league = this.db.getLeague(id);
    if (!league) throw new NotFoundException('League not found');
    const players = this.db.getPlayersByLeague(id).map(toLeaguePlayer);
    return { ...league, players };
  }

  addPlayer(leagueId: string, name: string, color: string): LeaguePlayer {
    if (!this.db.getLeague(leagueId)) {
      throw new NotFoundException('League not found');
    }
    const id = generateRandomString(10);
    this.db.insertPlayer({ id, leagueId, name, color });
    return { id, leagueId, name, color };
  }

  updatePlayer(
    leagueId: string,
    playerId: string,
    fields: { name?: string; color?: string },
  ): LeaguePlayer {
    const existing = this.db.getPlayer(playerId);
    if (!existing || existing.leagueId !== leagueId) {
      throw new NotFoundException('Player not found');
    }
    const updated = this.db.updatePlayer(playerId, fields);
    return toLeaguePlayer(updated);
  }

  // v1 rule: only allow delete when the player has no games in the league.
  deletePlayer(leagueId: string, playerId: string) {
    const existing = this.db.getPlayer(playerId);
    if (!existing || existing.leagueId !== leagueId) {
      throw new NotFoundException('Player not found');
    }
    this.db.deletePlayer(playerId);
  }

  private leagueGames(leagueId: string): Game[] {
    if (!this.db.getLeague(leagueId)) {
      throw new NotFoundException('League not found');
    }
    return this.db
      .getGamesByLeague(leagueId)
      .map((row) => JSON.parse(row.data) as Game);
  }

  getGames(leagueId: string): GameSummary[] {
    return this.leagueGames(leagueId).map((game) => {
      const finished = !game.state.running;
      let winner: GameSummary['winner'];
      let maxPoints = -Infinity;
      for (const ps of game.state.playerStates) {
        const points = currentPoints(
          ps.points.predicted,
          ps.points.actual,
        );
        if (points > maxPoints) {
          maxPoints = points;
          winner = {
            name: ps.player.name,
            color: ps.player.color,
            points,
          };
        }
      }
      return {
        joinCode: game.joinCode,
        name: game.name,
        createdAt: game.state.startTime,
        finished,
        winner,
        playerCount: game.state.playerStates.length,
      };
    });
  }

  getStandings(leagueId: string): Standing[] {
    const games = this.leagueGames(leagueId).filter((g) => !g.state.running);

    // Aggregate finished games grouped by playerId (falling back to name for
    // legacy games without a league link).
    const acc = new Map<
      string,
      {
        playerId: string;
        name: string;
        color: string;
        gamesPlayed: number;
        totalPoints: number;
        wins: number;
        bestGame: number;
      }
    >();

    for (const game of games) {
      // Score every player once, so we can also decide the winner of the game.
      const scored = game.state.playerStates.map((ps) => ({
        ps,
        points: currentPoints(ps.points.predicted, ps.points.actual),
      }));
      const maxPoints = scored.reduce(
        (m, s) => Math.max(m, s.points),
        -Infinity,
      );

      for (const { ps, points } of scored) {
        const key = ps.player.playerId ?? ps.player.name;
        const entry =
          acc.get(key) ??
          {
            playerId: ps.player.playerId ?? '',
            name: ps.player.name,
            color: ps.player.color,
            gamesPlayed: 0,
            totalPoints: 0,
            wins: 0,
            bestGame: -Infinity,
          };
        entry.gamesPlayed += 1;
        entry.totalPoints += points;
        entry.bestGame = Math.max(entry.bestGame, points);
        if (points === maxPoints) entry.wins += 1;
        // Keep the latest name/color snapshot.
        entry.name = ps.player.name;
        entry.color = ps.player.color;
        acc.set(key, entry);
      }
    }

    const standings: Standing[] = Array.from(acc.values()).map((e) => ({
      playerId: e.playerId,
      name: e.name,
      color: e.color,
      gamesPlayed: e.gamesPlayed,
      totalPoints: e.totalPoints,
      wins: e.wins,
      averagePoints:
        e.gamesPlayed > 0 ? Math.round(e.totalPoints / e.gamesPlayed) : 0,
      bestGame: e.bestGame === -Infinity ? 0 : e.bestGame,
    }));

    standings.sort((a, b) => b.totalPoints - a.totalPoints);
    return standings;
  }
}
