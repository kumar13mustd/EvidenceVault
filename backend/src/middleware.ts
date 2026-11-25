import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";

export interface AuthRequest extends Request {
  user?: { id: string; role: "admin" | "investigator"; email: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required." });
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthRequest["user"];
    if (!payload?.id || !payload.role) return res.status(401).json({ message: "Invalid token." });
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function allowRoles(...roles: Array<"admin" | "investigator">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "Insufficient permissions." });
    next();
  };
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err?.name === "ZodError") return res.status(400).json({ message: "Validation failed.", errors: err.issues });
  if (err?.code === 11000) return res.status(409).json({ message: "A record with that unique value already exists." });
  return res.status(err?.status || 500).json({ message: err?.message || "Internal server error." });
}
