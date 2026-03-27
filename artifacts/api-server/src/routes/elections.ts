import { Router } from "express";
import { db } from "@workspace/db";
import { electionsTable, positionsTable, candidatesTable, votesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router();

// GET /elections
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.select().from(electionsTable);

    const elections = status
      ? await db.select().from(electionsTable).where(eq(electionsTable.status, status as string))
      : await db.select().from(electionsTable);

    // For students, only show active/published elections
    if (req.user?.role === "student") {
      const visible = elections.filter(e => e.status === "active" || e.status === "published");
      res.json(visible);
      return;
    }

    res.json(elections);
  } catch (err) {
    req.log.error({ err }, "List elections error");
    res.status(500).json({ error: "Internal", message: "Failed to list elections" });
  }
});

// POST /elections
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (!title) {
      res.status(400).json({ error: "Validation", message: "Title is required" });
      return;
    }

    const [election] = await db.insert(electionsTable).values({
      title,
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }).returning();

    await logAction("election_created", `Election "${title}" created`, req.user!.id, req.user!.role, req);

    res.status(201).json(election);
  } catch (err) {
    req.log.error({ err }, "Create election error");
    res.status(500).json({ error: "Internal", message: "Failed to create election" });
  }
});

// GET /elections/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);

    if (!election) {
      res.status(404).json({ error: "Not Found", message: "Election not found" });
      return;
    }

    // Fetch positions with candidates
    const positions = await db.select().from(positionsTable).where(eq(positionsTable.electionId, id));
    const positionsWithCandidates = await Promise.all(
      positions.map(async (pos) => {
        const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.positionId, pos.id));
        return { ...pos, candidates };
      })
    );

    res.json({ ...election, positions: positionsWithCandidates });
  } catch (err) {
    req.log.error({ err }, "Get election error");
    res.status(500).json({ error: "Internal", message: "Failed to get election" });
  }
});

// PATCH /elections/:id
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { title, description, status, startDate, endDate } = req.body;

    const [existing] = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Not Found", message: "Election not found" });
      return;
    }

    const [updated] = await db.update(electionsTable).set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
    }).where(eq(electionsTable.id, id)).returning();

    await logAction("election_updated", `Election "${updated.title}" updated to status "${updated.status}"`, req.user!.id, req.user!.role, req);

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update election error");
    res.status(500).json({ error: "Internal", message: "Failed to update election" });
  }
});

// GET /elections/:id/results
router.get("/:id/results", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, id)).limit(1);

    if (!election) {
      res.status(404).json({ error: "Not Found", message: "Election not found" });
      return;
    }

    // Students can only view results for published elections
    if (req.user?.role === "student" && election.status !== "published") {
      res.status(403).json({ error: "Forbidden", message: "Results not yet available" });
      return;
    }

    const positions = await db.select().from(positionsTable).where(eq(positionsTable.electionId, id));
    const allVotes = await db.select().from(votesTable).where(eq(votesTable.electionId, id));

    // Count unique voters
    const uniqueVoters = new Set(allVotes.map(v => v.studentId)).size;

    const results = await Promise.all(
      positions.map(async (pos) => {
        const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.positionId, pos.id));
        const posVotes = allVotes.filter(v => v.positionId === pos.id);
        const totalPosVotes = posVotes.length;

        return {
          positionId: pos.id,
          positionTitle: pos.title,
          candidates: candidates.map(c => {
            const votes = posVotes.filter(v => v.candidateId === c.id).length;
            return {
              candidateId: c.id,
              candidateName: c.fullName,
              votes,
              percentage: totalPosVotes > 0 ? Math.round((votes / totalPosVotes) * 100 * 10) / 10 : 0,
            };
          }).sort((a, b) => b.votes - a.votes),
        };
      })
    );

    res.json({ election, results, totalVoters: uniqueVoters });
  } catch (err) {
    req.log.error({ err }, "Get results error");
    res.status(500).json({ error: "Internal", message: "Failed to get results" });
  }
});

export default router;
