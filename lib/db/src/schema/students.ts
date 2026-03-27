import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  schoolEmail: text("school_email").notNull(),
  password: text("password").notNull(),
  matricNumber: text("matric_number").notNull(),
  level: integer("level").notNull(), // 100-600
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("students_email_idx").on(table.schoolEmail),
  uniqueIndex("students_matric_idx").on(table.matricNumber),
]);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
