import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "investigator"], default: "investigator" }
}, { timestamps: true });

const caseSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  caseNumber: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "", maxlength: 2000 },
  status: { type: String, enum: ["open", "under-investigation", "closed"], default: "open" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const evidenceSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: "Case", required: true, index: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  sha256: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const auditSchema = new Schema({
  action: { type: String, required: true },
  details: { type: String, default: "" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  caseId: { type: Schema.Types.ObjectId, ref: "Case" },
  evidenceId: { type: Schema.Types.ObjectId, ref: "Evidence" },
  occurredAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);
export const Case = mongoose.model("Case", caseSchema);
export const Evidence = mongoose.model("Evidence", evidenceSchema);
export const Audit = mongoose.model("Audit", auditSchema);
