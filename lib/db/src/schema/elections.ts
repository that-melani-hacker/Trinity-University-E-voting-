import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const electionsTable = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["draft", "active", "ended", "published"] }).notNull().default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertElectionSchema = createInsertSchema(electionsTable).omit({ id: true, createdAt: true });
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof electionsTable.$inferSelect;
