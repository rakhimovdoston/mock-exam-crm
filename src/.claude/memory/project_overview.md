---
name: Mock Exam Project Overview
description: Full project architecture, tech stack, user roles, and module map for the mock-exam app
type: project
---

IELTS Mock Exam Management System — React SPA connected to REST API at `http://localhost:6464/` (dev).

**Why:** Test preparation center (likely Everest) managing IELTS mock exams for candidates — booking, exam delivery, and scoring.

**How to apply:** Use this context for any feature work — understanding how the booking flow, exam flow, admin vs student roles, and materials management fit together.

## Tech Stack
- React 19 + Vite 6 (frontend SPA)
- Redux Toolkit (5 reducers: auth, question, answer, exam, app)
- Ant Design 5 (UI), React Router v7, Axios, Slate.js (rich text editor)
- DnD Kit + React DnD (drag-and-drop in questions), Styled Components, React Toastify, Dayjs

## User Roles
- `ROLE_ADMIN` — full access
- `ROLE_BRANCH_ADMIN` — branch-level admin (users, bookings, results, test dates, devices)
- `ROLE_SPEAKER` — speaking sessions only
- `ROLE_USER` — student/candidate, takes exams

## Route Map
- `/login` — login page
- `/` → admin roles redirect to `/dashboard`, students see `HomePage` (Start Exam button)
- `/exam/:id` — exam entry (UserPage)
- `/reading/:id`, `/listening/:id`, `/writing/:id` — exam pages (fullscreen, secured)

### Admin Dashboard (`/dashboard`)
- `""` → DashboardPage — statistics (Reading/Writing/Listening counts, user totals by type, charts)
- `devices` — device management
- `users` — Candidates table (search by firstname/lastname/username, Book Test + View actions)
- `venues` → BranchPage — branches + packages CRUD
- `venue/:id` → BranchDetails — speakers, discounts (%), weekly schedule (morning/afternoon/evening slots), holidays
- `user/:id/booking` → UserBookingPage — multi-step booking: select package → test sessions → speaking sessions
- `user/:id` → UserDetails
- `contest` → ContestPage — test session bookings (filter by branch/date/time/status)
- `speaking` → SpeakingPage — speaking sessions
- `results` → ResultPage
- `employees` → EmployeePage (ROLE_ADMIN only)
- `employee/:id` → EmployeeDetails
- `contest/:id/:type` and `speaking/:id/:type` → ContestDetails
- `ielts/listening`, `ielts/reading`, `ielts/writing` — list IELTS materials
- `ielts/listening/:id`, `ielts/reading/:id`, `ielts/writing/:id` — create/edit materials
- `test-dates` → TestDates
- `history/:userId/writing/:id`, `history/:id/reading`, `history/:id/listening` — exam history

## Key Architecture Points
- JWT stored in `localStorage`, auto-attached via Axios interceptor
- 401/403 responses → `window.location.reload()`
- Exam answers persisted in `sessionStorage` (key: `exam_answers_reading_{id}`)
- Font size controlled globally via `app.size` Redux state (default 16px)
- `useApiRequest` hook — generic GET with loading/error/data
- `useExamSecurity` — currently only blocks `beforeunload` (keyboard/contextmenu blocking is commented out)
- Navbar filters menu items by user's first role (`user.roles[0]`)

## Booking Flow
1. Admin clicks "Book Test" on a candidate → `/dashboard/user/:id/booking`
2. Select a **package** (defines `totalSessions` + `speakingSessions` count)
3. Select **test session dates** (branch, date, time slot: morning/afternoon/evening)
4. Select **speaking session dates** (speaker, date, type: FACE_TO_FACE or ONLINE)
5. POST to `api/v1/booking/set` → redirects to `/dashboard/contest`

## IELTS Materials (Admin only)
- Reading: list (`/ielts/reading`) → create (`/ielts/reading/create`) → add questions (`/:id/questions`) → update (`/:id/update`)
- Listening: list → create/edit (`/:id`)
- Writing: list → details/create (`/:id` + `/ielts/writing/create`)
- Content uses Slate.js rich text with custom elements: MCQ, multiple-answer MCQ, fill-in-input, matching headings, tables, drag-and-drop list items

## Phone number format
- Uzbek format: `+998 (XX) XXX-XX-XX` (MaskedInput component enforces this)

## Candidate "Everester" field
- Boolean distinguishing Everest school students vs external candidates
- Dashboard shows separate counts for Everester / Non-Everester / Online Register
