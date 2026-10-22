# TaskFlow

A personal task tracker built with the MERN stack (MongoDB, Express, React, Node.js).

- **Live app:** _add hosted frontend URL_
- **API:** _add hosted API URL_ (health check: `/api/health`)
- **Repository:** _add GitHub URL_

## 1. Project definition

**Problem:** People lose track of what they need to do when tasks live in notes, chats and memory. TaskFlow gives each person one private, simple list.

**Users:** Registered users. Each user can only see and change their own tasks (no admin role in the MVP).

**MVP (must have):** register, log in, add / list / complete / delete tasks, filter by status, pagination.
**Later:** edit task text, due-date reminders, categories, admin role, dark mode.

### User stories and acceptance criteria
| Story | Acceptance criteria |
| --- | --- |
| As a visitor, I want to register so that I have a private account. | Invalid email or password under 8 characters shows a message and saves nothing. Duplicate email returns 409. Passwords are stored hashed. |
| As a user, I want to log in so that I can reach my tasks. | Wrong credentials show one generic error. Logged-out users are redirected from `/` to `/login`. |
| As a user, I want to add a task so that I can track my work. | Title required (max 100); due date optional. Empty title shows a message and saves nothing. New task appears without a manual refresh. |
| As a user, I want to mark a task done or delete it. | Status toggles and persists after refresh. Delete asks for confirmation. |
| As a user, I must not see other users' tasks. | Requests for another user's task id return 404. |

## 2. Architecture

```
React (Vite)  --HTTP/JSON-->  Express API  --Mongoose-->  MongoDB Atlas
client/                       server/
```
React never talks to MongoDB directly. Validation happens on both sides (client for UX, server for safety).

```
client/src  pages/ context/ services/api.js (all HTTP calls)
server/src  routes/ controllers/ models/ middleware/ config/
```

## 3. Data model
- **User:** name, email (unique), password (bcrypt hash, never returned), timestamps
- **Task:** user (ref User, indexed), title, description, dueDate, status (`todo` | `done`), timestamps. Tasks are *referenced* by user, not embedded, because they grow and change independently.

## 4. API contract
All `/api/tasks` routes need `Authorization: Bearer <token>`.

| Method and path | Purpose | Success | Errors |
| --- | --- | --- | --- |
| POST /api/auth/register | Create account (name, email, password) | 201 token + user | 400, 409 |
| POST /api/auth/login | Log in (email, password) | 200 token + user | 400, 401 |
| GET /api/auth/me | Current user | 200 user | 401 |
| GET /api/tasks?page=&limit=&status= | List own tasks (limit max 50) | 200 tasks, page, pages, total | 401 |
| POST /api/tasks | Create task (title, description, dueDate) | 201 task | 400, 401 |
| PATCH /api/tasks/:id | Update fields (e.g. status) | 200 task | 400, 401, 404 |
| DELETE /api/tasks/:id | Delete task | 200 message | 401, 404 |

Errors always return `{ "message": "..." }`; stack traces stay in server logs.

## 4b. Security measures
bcrypt hashing (cost 12) - JWT with expiry - ownership check on every task query - server-side validation and string-type checks (NoSQL operator injection) - 10 kb body limit - rate limiting on `/api/auth` - CORS limited to `CLIENT_ORIGIN` - secrets only in environment variables.

## 5. Run locally

Requirements: Node 18+, a MongoDB Atlas (or local) database.

```bash
# API
cd server
cp .env.example .env      # fill in MONGODB_URI and a long random JWT_SECRET
npm install
npm run dev               # http://localhost:5000

# Client (second terminal)
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

### Environment variables (names only)
| File | Variables |
| --- | --- |
| server/.env | PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_ORIGIN |
| client/.env | VITE_API_URL (public - never put secrets here) |

## 6. Deployment
Check each provider's current free-tier limits and docs first.
1. **Database:** MongoDB Atlas cluster, dedicated DB user with least privilege, allow your API host's network access.
2. **API:** a host that runs a long-lived Node server (e.g. Render). Root `server/`, build `npm install`, start `npm start`. Set all server variables, with `CLIENT_ORIGIN` = your live frontend URL.
3. **Frontend:** Vercel or Netlify. Root `client/`, build `npm run build`, output `dist`. Set `VITE_API_URL` = `https://<your-api>/api`. SPA fallback is already configured (`vercel.json`, `public/_redirects`).

### Post-deployment check
- [ ] Site loads over HTTPS with no console errors
- [ ] Register, login, add, complete and delete work on the live URL
- [ ] Refreshing `/login` or `/` works (no 404)
- [ ] No request points to localhost; no secrets in browser or repo

## 7. Testing record
Test with Postman/Thunder Client and the browser, then fill in the Result column.

| Area | Case | Expected | Result |
| --- | --- | --- | --- |
| Auth | Register with valid data | 201, token returned | |
| Auth | Register duplicate email | 409 | |
| Auth | Login with wrong password | 401 generic message | |
| Tasks | Create with empty title | 400, nothing saved | |
| Tasks | List without token | 401 | |
| Tasks | Update/delete another user's task id | 404 | |
| Tasks | `page=999`, `limit=1000` | Empty page / limit capped at 50 | |
| UI | Loading, empty, error and success states | All visible and correct | |
| UI | Phone width and keyboard-only use | Usable | |


## 8. Known limitations and future work
- Tasks cannot be edited after creation (only toggled or deleted).
- JWT is kept in `localStorage`: simple, but exposed to XSS; httpOnly cookies would be safer.
- No automated test suite yet; testing is manual (section 7).
- No password reset or email verification.
- Free hosting tiers may sleep, so the first request can be slow.
