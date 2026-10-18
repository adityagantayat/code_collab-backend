# code_collab-backend

> **REST API backend for a developer-focused code collaboration platform** — think LinkedIn for developers, with connection requests, profiles, and a curated user feed.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
  - [Auth](#auth-prefix-auth)
  - [Profile](#profile-prefix-profile--auth-required)
  - [Requests](#requests-prefix-requests--auth-required)
  - [User](#user-prefix-user--auth-required)
- [Data Models](#data-models)
- [Code Style & Linting](#code-style--linting)
- [Contributing](#contributing)

---

## Overview

`code_collab-backend` is the server-side application for a code collaboration social platform. It exposes a RESTful JSON API that handles:

- User registration and authentication (JWT via HTTP-only cookies)
- Profile management (view, edit, change password)
- Connection requests (send, review/accept/reject)
- A paginated user discovery feed (excludes existing connections and self)

---

## Tech Stack

| Layer          | Technology                   | Version  |
| -------------- | ---------------------------- | -------- |
| Runtime        | Node.js (ESM)                | ≥ 18     |
| Framework      | Express                      | ^5.3.0   |
| Database       | MongoDB via Mongoose         | ^9.11.2  |
| Auth           | jsonwebtoken + cookie-parser | ^9.0.3   |
| Password Hash  | bcrypt                       | ^6.0.0   |
| Validation     | validator                    | ^13.15.35|
| Linting        | ESLint (flat config)         | ^10.13.0 |

> **Module system**: ES Modules (`"type": "module"` in `package.json`). All relative imports must include the `.js` extension.

---

## Project Structure

```
code_collab-backend/
├── src/
│   ├── app.js                      # Express app entry point
│   ├── config/
│   │   └── db.js                   # MongoDB connection helper
│   ├── middlewares/
│   │   └── auth.middleware.js      # JWT verification, attaches req.user
│   ├── models/
│   │   ├── user.js                 # User schema + methods
│   │   └── connectionRequest.js   # ConnectionRequest schema
│   ├── routes/
│   │   ├── auth.routes.js          # /auth  (signup, signin, signout)
│   │   ├── profile.routes.js       # /profile (view, edit, change-password)
│   │   ├── request.routes.js       # /requests (send, review)
│   │   └── user.routes.js          # /user (feed, connections, received)
│   └── utils/
│       ├── constants.js            # STATUS enum, SAFE_DATA projection
│       └── validation.js           # Input validators
├── eslint.config.js
├── jsconfig.json
├── package.json
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── Progress.md
└── README.md
```

---

## Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd code_collab-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**  
   The app currently reads MongoDB URI and JWT secret from hardcoded values (development mode). Before production, move these to a `.env` file and use `process.env`.

   | Variable         | Default (dev)                         | Description           |
   | ---------------- | ------------------------------------- | --------------------- |
   | `MONGO_URI`      | `mongodb://localhost:27017/codeCollab`| MongoDB connection    |
   | `JWT_SECRET`     | `'secret'`                            | JWT signing secret    |
   | `PORT`           | `3000`                                | HTTP listen port      |

---

## Running the Server

```bash
# Development (with file watching, auto-restart)
npm run dev

# Production
npm start

# Lint
npm run lint

# Lint + auto-fix
npm run lint:fix
```

Server starts on **http://localhost:3000**.

Healthcheck: `GET /healthcheck` → `200 OK`

---

## API Reference

All authenticated routes require a valid `token` cookie (set on sign-in).  
All request bodies are JSON (`Content-Type: application/json`).

---

### Auth — prefix `/auth`

#### `POST /auth/signup`
Create a new user account.

**Body**
```json
{
  "firstName": "Aditya",
  "lastName": "Gantayat",
  "emailId": "aditya@example.com",
  "password": "Str0ng@Pass!"
}
```

| Status | Meaning                          |
| ------ | -------------------------------- |
| 201    | User created successfully        |
| 400    | Validation error (name, email, weak password, etc.) |
| 409    | Email already registered         |
| 500    | Server error                     |

---

#### `POST /auth/signin`
Authenticate and receive a session cookie.

**Body**
```json
{
  "emailId": "aditya@example.com",
  "password": "Str0ng@Pass!"
}
```

| Status | Meaning                     |
| ------ | --------------------------- |
| 200    | Signed in, `token` cookie set |
| 400    | Missing email or password   |
| 401    | Invalid credentials         |
| 500    | Server error                |

---

#### `POST /auth/signout`
Clears the `token` cookie.

| Status | Meaning   |
| ------ | --------- |
| 200    | Signed out |

---

### Profile — prefix `/profile` · Auth required

#### `GET /profile/view`
Returns the authenticated user's full profile (password excluded).

| Status | Meaning           |
| ------ | ----------------- |
| 200    | Profile JSON      |
| 401    | Not authenticated |

---

#### `PATCH /profile/edit`
Update allowed profile fields.

**Allowed fields**: `firstName`, `lastName`, `age`, `gender`, `about`, `skills`, `photoUrl`

**Body** (any subset of allowed fields)
```json
{
  "about": "Full-stack developer",
  "skills": ["Node.js", "React"]
}
```

| Status | Meaning                     |
| ------ | --------------------------- |
| 200    | Profile updated             |
| 400    | Invalid/disallowed fields   |
| 401    | Not authenticated           |
| 500    | Server error                |

---

#### `PATCH /profile/change-password`
Change the authenticated user's password.

**Body**
```json
{
  "currentPassword": "OldPass@1",
  "newPassword": "NewStr0ng@Pass!"
}
```

| Status | Meaning                           |
| ------ | --------------------------------- |
| 200    | Password changed                  |
| 400    | Missing fields or weak new password |
| 401    | Incorrect current password        |
| 500    | Server error                      |

---

### Requests — prefix `/requests` · Auth required

#### `POST /requests/send/:status/:toUserId`
Send a connection request to another user.

**Params**
- `:status` — `interested` or `ignored`
- `:toUserId` — valid MongoDB ObjectId of the target user

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Request sent                             |
| 400    | Invalid status / bad ID / self-request   |
| 404    | Target user not found                    |
| 409    | Request already exists (either direction)|
| 500    | Server error                             |

---

#### `PATCH /requests/review/:status/:requestId`
Accept or reject an incoming connection request.

**Params**
- `:status` — `accepted` or `rejected`
- `:requestId` — valid MongoDB ObjectId of the connection request

> Only the **recipient** of a request can review it. The request must be in `interested` status.

| Status | Meaning                                   |
| ------ | ----------------------------------------- |
| 200    | Request updated                           |
| 400    | Invalid status / bad ID format            |
| 404    | Request not found or not addressable to you|
| 500    | Server error                              |

---

### User — prefix `/user` · Auth required

#### `GET /user/requests/received`
List all pending (`interested`) connection requests sent to the authenticated user.
Populates sender's safe public fields.

| Status | Meaning      |
| ------ | ------------ |
| 200    | Array of requests |

---

#### `GET /user/connections`
List all accepted connections for the authenticated user.
Returns an array of connected user profiles (safe fields only).

| Status | Meaning           |
| ------ | ----------------- |
| 200    | Array of user profiles |

---

#### `GET /user/feed?page=1&limit=10`
Paginated discovery feed — excludes self, existing connections, and any users already involved in a connection request (any status).

**Query Params**
| Param   | Default | Min | Max | Description            |
| ------- | ------- | --- | --- | ---------------------- |
| `page`  | 1       | 1   | —   | Page number            |
| `limit` | 10      | 1   | 50  | Results per page       |

| Status | Meaning           |
| ------ | ----------------- |
| 200    | `{ data: [...] }` |

---

## Data Models

### User

| Field       | Type     | Constraints                              |
| ----------- | -------- | ---------------------------------------- |
| `firstName` | String   | required, minLen 3, maxLen 10            |
| `lastName`  | String   | minLen 3, maxLen 30                      |
| `emailId`   | String   | required, unique, lowercase, trimmed     |
| `password`  | String   | required, minLen 8, maxLen 80 (bcrypt)   |
| `age`       | Number   | optional                                 |
| `gender`    | String   | enum: `male` \| `female` \| `other`     |
| `about`     | String   | optional                                 |
| `skills`    | [String] | optional                                 |
| `photoUrl`  | String   | optional                                 |

> `password` is **never** returned in JSON responses (stripped via `toJSON` transform).

### ConnectionRequest

| Field        | Type     | Constraints                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `fromUserId` | ObjectId | ref: User, required                                   |
| `toUserId`   | ObjectId | ref: User, required                                   |
| `status`     | String   | enum: `interested` \| `ignored` \| `accepted` \| `rejected` |

Compound index on `{ fromUserId, toUserId }` for fast duplicate lookups.

---

## Code Style & Linting

- **Single quotes** — mandatory
- **Semicolons** — mandatory
- **ESM imports** — must include `.js` extension on relative paths
- **No undefined variables** — enforced via `no-undef` with Node globals

Run `npm run lint:fix` to auto-correct fixable issues.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with clear messages (update `Progress.md` on every commit)
4. Push and open a Pull Request

> See `AGENTS.md` for AI agent guidelines and `CLAUDE.md` for AI assistant conventions used in this project.
