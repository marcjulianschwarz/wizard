import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database = require('better-sqlite3');
import { dirname } from 'path';
import { mkdirSync } from 'fs';

// Row shapes as stored in SQLite. The whole Game object lives in `data` as a
// JSON blob; only queryable fields are promoted to real columns.
export interface GameRow {
  joinCode: string;
  leagueId: string | null;
  data: string;
  createdAt: number;
  finished: number;
}

export interface LeagueRow {
  id: string;
  name: string;
  createdAt: number;
}

export interface PlayerRow {
  id: string;
  leagueId: string;
  name: string;
  color: string;
}

const DEFAULT_DB_PATH = './data/wizard.db';

@Injectable()
export class DbService implements OnModuleInit {
  private db: Database.Database;
  private readonly logger = new Logger(DbService.name);

  constructor(private readonly config: ConfigService) {
    const path = this.config.get<string>('DATABASE_PATH') ?? DEFAULT_DB_PATH;
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.logger.log(`Opened SQLite database at ${path}`);
  }

  onModuleInit() {
    this.bootstrap();
  }

  // Idempotent bootstrap migration — safe to run on every boot.
  private bootstrap() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS League (
        id        TEXT PRIMARY KEY,
        name      TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Player (
        id        TEXT PRIMARY KEY,
        leagueId  TEXT NOT NULL,
        name      TEXT NOT NULL,
        color     TEXT NOT NULL,
        FOREIGN KEY (leagueId) REFERENCES League(id)
      );

      CREATE TABLE IF NOT EXISTS Game (
        joinCode  TEXT PRIMARY KEY,
        leagueId  TEXT,
        data      TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        finished  INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (leagueId) REFERENCES League(id)
      );

      CREATE INDEX IF NOT EXISTS idx_player_league ON Player(leagueId);
      CREATE INDEX IF NOT EXISTS idx_game_league ON Game(leagueId);
    `);
  }

  get connection(): Database.Database {
    return this.db;
  }

  // --- Game helpers -------------------------------------------------------

  upsertGame(row: GameRow) {
    this.db
      .prepare(
        `INSERT INTO Game (joinCode, leagueId, data, createdAt, finished)
         VALUES (@joinCode, @leagueId, @data, @createdAt, @finished)
         ON CONFLICT(joinCode) DO UPDATE SET
           leagueId = excluded.leagueId,
           data     = excluded.data,
           finished = excluded.finished`,
      )
      .run(row);
  }

  getGame(joinCode: string): GameRow | undefined {
    return this.db
      .prepare(`SELECT * FROM Game WHERE joinCode = ?`)
      .get(joinCode) as GameRow | undefined;
  }

  getAllGames(): GameRow[] {
    return this.db.prepare(`SELECT * FROM Game`).all() as GameRow[];
  }

  getGamesByLeague(leagueId: string): GameRow[] {
    return this.db
      .prepare(`SELECT * FROM Game WHERE leagueId = ? ORDER BY createdAt DESC`)
      .all(leagueId) as GameRow[];
  }

  // --- League helpers -----------------------------------------------------

  insertLeague(row: LeagueRow) {
    this.db
      .prepare(
        `INSERT INTO League (id, name, createdAt) VALUES (@id, @name, @createdAt)`,
      )
      .run(row);
  }

  getLeague(id: string): LeagueRow | undefined {
    return this.db.prepare(`SELECT * FROM League WHERE id = ?`).get(id) as
      | LeagueRow
      | undefined;
  }

  // --- Player helpers -----------------------------------------------------

  insertPlayer(row: PlayerRow) {
    this.db
      .prepare(
        `INSERT INTO Player (id, leagueId, name, color)
         VALUES (@id, @leagueId, @name, @color)`,
      )
      .run(row);
  }

  updatePlayer(id: string, fields: { name?: string; color?: string }) {
    const existing = this.getPlayer(id);
    if (!existing) return undefined;
    const next = { ...existing, ...fields };
    this.db
      .prepare(`UPDATE Player SET name = @name, color = @color WHERE id = @id`)
      .run(next);
    return next;
  }

  deletePlayer(id: string) {
    this.db.prepare(`DELETE FROM Player WHERE id = ?`).run(id);
  }

  getPlayer(id: string): PlayerRow | undefined {
    return this.db.prepare(`SELECT * FROM Player WHERE id = ?`).get(id) as
      | PlayerRow
      | undefined;
  }

  getPlayersByLeague(leagueId: string): PlayerRow[] {
    return this.db
      .prepare(`SELECT * FROM Player WHERE leagueId = ? ORDER BY name`)
      .all(leagueId) as PlayerRow[];
  }
}
