import { Router } from "express";
import { db } from "@workspace/db";
import { votesTable, electionsTable, positionsTable, candidatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logAction } from "../lib/audit.js";

const router = Router();

// POST /votes - Cast a vote
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      res.status(403).json({ error: "Forbidden", message: "Only students can vote" });
      return;
    }

    const { electionId, positionId, candidateId } = req.body;

    if (!electionId || !positionId || !candidateId) {
      res.status(400).json({ error: "Validation", message: "electionId, positionId, and candidateId are required" });
      return;
    }

    // Check election is active
    const [election] = await db.select().from(electionsTable).where(eq(electionsTable.id, electionId)).limit(1);
    if (!election) {
      res.status(404).json({ error: "Not Found", message: "Election not found" });
      return;
    }
    if (election.status !== "active") {
      res.status(403).json({ error: "Forbidden", message: "Voting is not open for this election" });
      return;
    }

    // Verify position belongs to election
    const [position] = await db.select().from(positionsTable).where(
      and(eq(positionsTable.id, positionId), eq(positionsTable.electionId, electionId))
    ).limit(1);
    if (!position) {
      res.status(400).json({ error: "Validation", message: "Position does not belong to this election" });
      return;
    }

    // Verify candidate belongs to position
    const [candidate] = await db.select().from(candidatesTable).where(
      and(eq(candidatesTable.id, candidateId), eq(candidatesTable.positionId, positionId))
    ).limit(1);
    if (!candidate) {
      res.status(400).json({ error: "Validation", message: "Candidate does not belong to this position" });
      return;
    }

    // Check if student already voted for this position
    const existingVote = await db.select().from(votesTable).where(
      and(
        eq(votesTable.studentId, req.user!.id),
        eq(votesTable.electionId, electionId),
        eq(votesTable.positionId, positionId)
      )
    ).limit(1);

    if (existingVote.length > 0) {
      res.status(400).json({ error: "Duplicate", message: "You have already voted for this position" });
      return;
    }

    // Cast vote
    await db.insert(votesTable).values({
      studentId: req.user!.id,
      electionId,
      positionId,
      candidateId,
    });

    await logAction("vote_cast", `Student voted for position ${positionId} in election ${electionId}`, req.user!.id, "student", req);

    res.status(201).json({ success: true, message: "Your vote has been recorded successfully" });
  } catch (err: any) {
    // Handle unique constraint violation (race condition)
    if (err.code === "23505") {
      res.status(400).json({ error: "Duplicate", message: "You have already voted for this position" });
      return;
    }
    req.log.error({ err }, "Cast vote error");
    res.status(500).json({ error: "Internal", message: "Failed to cast vote" });
  }
});

// GET /votes/my-votes - Get current student's votes
router.get("/my-votes", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      res.status(403).json({ error: "Forbidden", message: "Students only" });
      return;
    }

    const votes = await db
      .select({
        positionId: votesTable.positionId,
        positionTitle: positionsTable.title,
        candidateId: votesTable.candidateId,
        candidateName: candidatesTable.fullName,
        electionId: votesTable.electionId,
      })
      .from(votesTable)
      .innerJoin(positionsTable, eq(votesTable.positionId, positionsTable.id))
      .innerJoin(candidatesTable, eq(votesTable.candidateId, candidatesTable.id))
      .where(eq(votesTable.studentId, req.user!.id));

    res.json(votes);
  } catch (err) {
    req.log.error({ err }, "Get my votes error");
    res.status(500).json({ error: "Internal", message: "Failed to get votes" });
  }
});

export default router;
