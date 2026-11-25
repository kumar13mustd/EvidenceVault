import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { config } from "../config";
import { authenticate, AuthRequest } from "../middleware";
import { Audit, Case, Evidence } from "../models";

export const evidenceRouter = Router();
evidenceRouter.use(authenticate);

const allowed = new Set(["image/png", "image/jpeg", "application/pdf", "text/plain", "application/zip"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).slice(0, 12)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxFileMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type."))
});

function sha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

evidenceRouter.post("/:caseId", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Select a supported file." });
    const caseRecord = await Case.findById(req.params.caseId);
    if (!caseRecord) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Case not found." });
    }
    const hash = await sha256(req.file.path);
    const record = await Evidence.create({
      caseId: caseRecord.id, originalName: path.basename(req.file.originalname).slice(0, 180),
      storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size,
      sha256: hash, uploadedBy: req.user!.id
    });
    await Audit.create({ action: "EVIDENCE_UPLOADED", details: `Uploaded ${record.originalName}; SHA-256 ${hash}`, userId: req.user!.id, caseId: caseRecord.id, evidenceId: record.id });
    res.status(201).json(record);
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(e);
  }
});

evidenceRouter.get("/case/:caseId", async (req, res, next) => {
  try {
    res.json(await Evidence.find({ caseId: req.params.caseId }).populate("uploadedBy", "name email").sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

evidenceRouter.post("/:id/verify", async (req: AuthRequest, res, next) => {
  try {
    const item = await Evidence.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Evidence not found." });
    const filePath = path.join(config.uploadDir, item.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Stored evidence file is missing." });
    const actual = await sha256(filePath);
    const integrity = actual === item.sha256;
    await Audit.create({ action: integrity ? "INTEGRITY_VERIFIED" : "INTEGRITY_MISMATCH", details: `Evidence ${item.id}; expected ${item.sha256}; actual ${actual}`, userId: req.user!.id, caseId: item.caseId, evidenceId: item.id });
    res.json({ evidenceId: item.id, integrity, expectedSha256: item.sha256, actualSha256: actual });
  } catch (e) { next(e); }
});
