import { Router } from "express";
import { Audit } from "../models";
import { authenticate, AuthRequest } from "../middleware";

export const auditRouter = Router();
auditRouter.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const filter = req.user!.role === "admin" ? {} : { userId: req.user!.id };
    const logs = await Audit.find(filter).populate("userId", "name email").populate("caseId", "caseNumber title").sort({ occurredAt: -1 }).limit(200);
    res.json(logs);
  } catch (e) { next(e); }
});
