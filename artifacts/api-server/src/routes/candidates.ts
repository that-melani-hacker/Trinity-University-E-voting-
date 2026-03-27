import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, positionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router({ mergeParams: true });

// GET /positions/:positionId/candidates
router.get("/", requireAuth, async (req, res) => {
  try {
    const positionId = parseInt(req.params["positionId"]!);
    const candidates = await db.select().from(candidatesTable).where(eq(candidatesTable.positionId, positionId));
    res.json(candidates);
  } catch (err) {
    req.log.error({ err }, "List candidates error");
    res.status(500).json({ error: "Internal", message: "Failed to list candidates" });
  }
});

// POST /positions/:positionId/candidates
router.post("/", requireAdmin, async (req, res) => {
  try {
    const positionId = parseInt(req.params["positionId"]!);
    const { fullName, biography } = req.body;

    if (!fullName) {
      res.status(400).json({ error: "Validation", message: "Full name is required" });
      return;
    }

    // Verify position exists
    const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, positionId)).limit(1);
    if (!position) {
      res.status(404).json({ error: "Not Found", message: "Position not found" });
      return;
    }

    const [candidate] = await db.insert(candidatesTable).values({
      fullName,
      biography,
      positionId,
    }).returning();

    await logAction("candidate_added", `Candidate "${fullName}" added to position ${positionId}`, req.user!.id, req.user!.role, req);

    res.status(201).json(candidate);
  } catch (err) {
    req.log.error({ err }, "Create candidate error");
    res.status(500).json({ error: "Internal", message: "Failed to create candidate" });
  }
});

export default router;
