import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  fid: integer("fid").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  pfpUrl: text("pfp_url"),
  walletAddress: text("wallet_address"),
  coins: integer("coins").default(500).notNull(),
  gems: integer("gems").default(0).notNull(),
  totalWins: integer("total_wins").default(0).notNull(),
  totalLosses: integer("total_losses").default(0).notNull(),
  totalGoals: integer("total_goals").default(0).notNull(),
  rating: integer("rating").default(1000).notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  selectedCharacter: text("selected_character").default("default"),
  selectedBall: text("selected_ball").default("classic"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  fid: integer("fid").notNull().references(() => players.fid),
  itemId: text("item_id").notNull(),
  itemType: text("item_type").notNull(),
  acquiredAt: timestamp("acquired_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: text("id").primaryKey(),
  player1Fid: integer("player1_fid").notNull(),
  player2Fid: integer("player2_fid"),
  isAi: boolean("is_ai").default(false),
  winnerId: integer("winner_id"),
  score1: integer("score1").default(0),
  score2: integer("score2").default(0),
  duration: integer("duration"),
  replayData: jsonb("replay_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const missions = pgTable("missions", {
  id: text("id").primaryKey(),
  fid: integer("fid").notNull().references(() => players.fid),
  missionType: text("mission_type").notNull(),
  progress: integer("progress").default(0),
  target: integer("target").notNull(),
  completed: boolean("completed").default(false),
  claimed: boolean("claimed").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
  fid: integer("fid").primaryKey().references(() => players.fid),
  rating: integer("rating").notNull(),
  wins: integer("wins").default(0),
  season: integer("season").default(1),
  rank: integer("rank"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
