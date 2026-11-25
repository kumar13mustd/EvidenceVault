export interface User { id: string; name: string; email: string; role: "admin" | "investigator"; }
export interface CaseItem { _id: string; title: string; caseNumber: string; description: string; status: string; createdAt: string; }
export interface EvidenceItem { _id: string; originalName: string; mimeType: string; size: number; sha256: string; createdAt: string; }
