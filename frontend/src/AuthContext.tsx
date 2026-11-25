import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { api } from "./api";
import { User } from "./types";

type AuthValue = { user: User | null; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => void; };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("ev_user"); return saved ? JSON.parse(saved) as User : null;
  });
  const save = (u: User, token: string) => { localStorage.setItem("ev_token", token); localStorage.setItem("ev_user", JSON.stringify(u)); setUser(u); };
  const login = async (email: string, password: string) => { const { data } = await api.post("/auth/login", { email, password }); save(data.user, data.token); };
  const register = async (name: string, email: string, password: string) => { await api.post("/auth/register", { name, email, password }); };
  const logout = () => { localStorage.removeItem("ev_token"); localStorage.removeItem("ev_user"); setUser(null); };
  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be inside AuthProvider"); return value; }
