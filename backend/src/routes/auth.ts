import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models";
import { config } from "../config";
import { authenticate, AuthRequest } from "../middleware";

export const authRouter = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(10).max(100)
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ message: "Email already registered." });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ name: data.name, email, passwordHash, role: "investigator" });
    res.status(201).json({ message: "Account created. Sign in to continue.", user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const data = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password." });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: "4h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select("name email role");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (e) { next(e); }
});
