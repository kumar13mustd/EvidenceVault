# EvidenceVault — Digital Evidence Management (AWT Mini Project)

A student demonstration full-stack app for case management, evidence uploads, SHA-256 integrity checks, JWT authentication, role-based access, and custody/audit events.

## Stack
- Frontend: React, Vite, TypeScript, React Router, Axios, Context API
- Backend: Node.js, Express, TypeScript, Mongoose, MongoDB
- Security: bcrypt, JWT, Helmet, CORS, rate limiting, Zod validation
- Evidence: Multer + SHA-256

> Educational prototype only. Do not use as the sole repository for real/legal evidence. Local uploads are not immutable or independently timestamped. Real forensic workflows need validated acquisition, write blockers, access-controlled immutable/WORM storage, trusted time, backup, and independently protected audit logs.

## Requirements
- Node.js 20+ and npm
- MongoDB local or MongoDB Atlas
- Postman (recommended)

## 1. Configure backend
```bash
cd backend
cp .env.example .env
npm install
```
Set `MONGODB_URI` and a long random `JWT_SECRET` in `.env`.

## 2. Configure frontend
```bash
cd ../frontend
cp .env.example .env
npm install
```
Default API URL is `http://localhost:5000/api`.

## 3. Run
Terminal 1:
```bash
cd backend
npm run dev
```
Terminal 2:
```bash
cd frontend
npm run dev
```
Open the Vite URL, normally http://localhost:5173.

## 4. Create first administrator
Register normally, then promote the first user manually in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```
This is deliberately not exposed as a public registration option. Log out and log back in.

## 5. Suggested demo flow
1. Register an account and sign in.
2. Promote that account to admin using the database command above.
3. Create a case.
4. Open the case and upload a small test file.
5. Record the displayed SHA-256 value.
6. Click Verify integrity.
7. Review the custody/audit history.
8. Create a second investigator account and test role restrictions.

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/cases`
- `POST /api/cases` (admin/investigator)
- `GET /api/cases/:id`
- `POST /api/evidence/:caseId` (multipart field: `file`)
- `GET /api/evidence/case/:caseId`
- `POST /api/evidence/:id/verify`
- `GET /api/audit`

All protected routes require `Authorization: Bearer <token>`.

## Deployment checklist
### MongoDB Atlas
1. Create a free cluster and database user.
2. Allow the deployment provider's network access (avoid broad access in production).
3. Copy the connection string into Render environment variables as `MONGODB_URI`.

### Backend on Render
1. Create a Web Service from the repository, root directory `backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`.
5. Note: Render's local filesystem may be ephemeral. For durable evidence storage, configure private object storage (S3-compatible) before treating uploads as persistent.

### Frontend on Vercel
1. Import repository, root directory `frontend`.
2. Build command: `npm run build`; output directory: `dist`.
3. Add `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`.
4. Set backend `CLIENT_ORIGIN` to your deployed frontend origin.

## Screenshots for practical submission
Capture genuine screenshots from your running/deployed app:
1. Login page
2. Dashboard with summary cards
3. Case creation/list page
4. Case detail with uploaded evidence
5. SHA-256 hash and successful integrity verification
6. Chain-of-custody/audit history
7. Postman successful API response
8. Deployed frontend URL and backend `/api/health` response

Do not submit mock screenshots as proof of a working deployment.

## Important improvements before real use
- Replace local disk storage with private object storage and retention locks.
- Keep originals read-only; verify hash after every retrieval.
- Use a trusted timestamping service and append-only external audit storage.
- Add MFA, password reset, account lockout, malware scanning, backup/restore tests, and security review.
- Define evidence acquisition and access procedures with your institution/supervisor.
