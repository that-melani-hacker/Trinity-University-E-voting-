import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import electionsRouter from "./elections.js";
import positionsRouter from "./positions.js";
import candidatesRouter from "./candidates.js";
import votesRouter from "./votes.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/elections", electionsRouter);
router.use("/elections/:electionId/positions", positionsRouter);
router.use("/positions/:positionId/candidates", candidatesRouter);
router.use("/votes", votesRouter);
router.use("/admin", adminRouter);

export default router;
