import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { positionsTable } from "./positions";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  biography: text("biography"),
  positionId: integer("position_id").notNull().references(() => positionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
