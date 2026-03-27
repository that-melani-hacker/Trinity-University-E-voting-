import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { electionsTable } from "./elections";

export const positionsTable = pgTable("positions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  electionId: integer("election_id").notNull().references(() => electionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPositionSchema = createInsertSchema(positionsTable).omit({ id: true, createdAt: true });
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positionsTable.$inferSelect;
