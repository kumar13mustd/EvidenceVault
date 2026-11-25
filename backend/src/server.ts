import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { config } from "./config";
import { authRouter } from "./routes/auth";
import { caseRouter } from "./routes/cases";
import { evidenceRouter } from "./routes/evidence";
import { auditRouter } from "./routes/audit";
import { errorHandler } from "./middleware";

const app = express();
fs.mkdirSync(config.uploadDir, { recursive: true });

app.use(helmet());
app.use(cors({ origin: config.clientOrigin.split(",").map(s => s.trim()), credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "EvidenceVault API" }));
app.use("/api/auth", authRouter);
app.use("/api/cases", caseRouter);
app.use("/api/evidence", evidenceRouter);
app.use("/api/audit", auditRouter);
app.use(errorHandler);

mongoose.connect(config.mongoUri).then(() => {
  app.listen(config.port, () => console.log(`EvidenceVault API listening on ${config.port}`));
}).catch(err => {
  console.error("MongoDB connection failed", err);
  process.exit(1);
});
