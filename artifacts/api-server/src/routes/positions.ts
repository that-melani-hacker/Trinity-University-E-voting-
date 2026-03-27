import { Router } from "express";
import { db } from "@workspace/db";
import { positionsTable, candidatesTable, electionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router({ mergeParams: true });

// GET /elections/:electionId/positions
router.get("/", requireAuth, async (req, res) => {
  try {
    const electionId = parseInt(req.params["electionId"]!);
    const positions = await db.select().from(positionsTable).where(eq(positionsTable.electionId, electionId));
    res.json(positions);
  } catch (err) {
    req.log.error({ err }, "List positions error");
    res.status(500).json({ error: "Internal", message: "Failed to list positions" });
  }
});

// POST /elections/:electionId/positions
router.post("/", requireAdmin, async (req, res) => {
  try {
    const electionId = parseInt(req.params["electionId"]!);
    const { title, description } = req.body;

    if (!title) {
      res.status(400).json({ error: "Validation", message: "Title is required" });
      return;
    }

    // Verify election exists
    const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!election) {
      res.status(404).json({ error: "Not Found", message: "Election not found" });
      return;
    }

    const [position] = await db.insert(positionsTable).values({
      title,
      description,
      electionId,
    }).returning();

    await logAction("position_created", `Position "${title}" created in election ${electionId}`, req.user!.id, req.user!.role, req);

    res.status(201).json(position);
  } catch (err) {
    req.log.error({ err }, "Create position error");
    res.status(500).json({ error: "Internal", message: "Failed to create position" });
  }
});

export default router;
