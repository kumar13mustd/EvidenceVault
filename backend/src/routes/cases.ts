import { Router } from "express";
import { z } from "zod";
import { Case, Audit } from "../models";
import { authenticate, allowRoles, AuthRequest } from "../middleware";

export const caseRouter = Router();
caseRouter.use(authenticate);

caseRouter.get("/", async (_req: AuthRequest, res, next) => {
  try { res.json(await Case.find().populate("createdBy", "name email").sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});

caseRouter.post("/", allowRoles("admin", "investigator"), async (req: AuthRequest, res, next) => {
  try {
    const data = z.object({
      title: z.string().trim().min(3).max(120),
      caseNumber: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/),
      description: z.string().max(2000).optional()
    }).parse(req.body);
    const record = await Case.create({ ...data, createdBy: req.user!.id });
    await Audit.create({ action: "CASE_CREATED", details: `Created case ${record.caseNumber}`, userId: req.user!.id, caseId: record.id });
    res.status(201).json(record);
  } catch (e) { next(e); }
});

caseRouter.get("/:id", async (req, res, next) => {
  try {
    const record = await Case.findById(req.params.id).populate("createdBy", "name email");
    if (!record) return res.status(404).json({ message: "Case not found." });
    res.json(record);
  } catch (e) { next(e); }
});
