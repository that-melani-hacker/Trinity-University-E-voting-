import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, electionsTable, votesTable, auditLogsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAdmin, requireSystemAdmin } from "../lib/auth.js";

const router = Router();

// GET /admin/students - List all students (system admin only)
router.get("/students", requireSystemAdmin, async (req, res) => {
  try {
    const students = await db.select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      schoolEmail: studentsTable.schoolEmail,
      matricNumber: studentsTable.matricNumber,
      level: studentsTable.level,
      createdAt: studentsTable.createdAt,
    }).from(studentsTable).orderBy(studentsTable.createdAt);

    res.json(students);
  } catch (err) {
    req.log.error({ err }, "List students error");
    res.status(500).json({ error: "Internal", message: "Failed to list students" });
  }
});

// GET /admin/dashboard - Dashboard stats
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const [studentCount] = await db.select({ count: count() }).from(studentsTable);
    const [electionCount] = await db.select({ count: count() }).from(electionsTable);
    const activeElections = await db.select().from(electionsTable).where(eq(electionsTable.status, "active"));
    const [voteCount] = await db.select({ count: count() }).from(votesTable);

    res.json({
      totalStudents: studentCount?.count ?? 0,
      totalElections: electionCount?.count ?? 0,
      activeElections: activeElections.length,
      totalVotes: voteCount?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal", message: "Failed to get dashboard stats" });
  }
});

// GET /admin/audit-logs - Audit logs (system admin only)
router.get("/audit-logs", requireSystemAdmin, async (req, res) => {
  try {
    const logs = await db.select().from(auditLogsTable).orderBy(auditLogsTable.createdAt);
    // Return most recent first
    res.json(logs.reverse());
  } catch (err) {
    req.log.error({ err }, "Audit logs error");
    res.status(500).json({ error: "Internal", message: "Failed to get audit logs" });
  }
});

export default router;
