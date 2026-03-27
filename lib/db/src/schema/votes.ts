import { pgTable, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { electionsTable } from "./elections";
import { positionsTable } from "./positions";
import { candidatesTable } from "./candidates";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  electionId: integer("election_id").notNull().references(() => electionsTable.id, { onDelete: "cascade" }),
  positionId: integer("position_id").notNull().references(() => positionsTable.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Enforce one vote per student per position per election
  uniqueIndex("votes_unique_idx").on(table.studentId, table.electionId, table.positionId),
]);

export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, createdAt: true });
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
