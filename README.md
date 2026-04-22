# WorkSphere Workplace Management System

## Overview

WorkSphere is a role-based workplace management platform for organizations that need a single system to coordinate employees, managers, projects, attendance, leave, facilities, assets, wellness, and internal notifications.

It is designed for three primary user groups:

- `Admin`: manages employees, attendance visibility, assets, feedback oversight, and workload risk monitoring
- `Manager`: manages team projects, assigns tasks, approves leave, monitors wellness signals, and publishes team announcements
- `Employee`: tracks assigned work, attendance, leave requests, assets, facilities, wellness check-ins, and feedback

The core value of the system is operational visibility across people, workspace resources, and daily workflows in one dashboard-oriented application.

## Features

### Authentication & Access Control

- JWT-based login and protected API access
- Role-based routing in the frontend for `admin`, `manager`, and `employee`
- User registration with department and manager assignment
- Forgot-password and reset-password flow using backend-generated reset tokens

### Employee & Access Management

- Create, list, update, archive, unarchive, and delete users
- Track employee role and department changes in history records
- Assign managers to employees
- Automatic default laptop assignment for newly created employees
- Offboarding notification sent to IT/admin when an employee is archived

### Project & Task Management

- Create projects with manager ownership
- Assign team members to projects
- View projects based on role:
  - admins see all projects
  - managers see owned projects
  - employees see only assigned projects
- Create tasks for project members
- Update task status (`todo`, `in-progress`, `done`)
- Automatically recalculate project progress from completed tasks
- Prevent task assignment when the due date falls inside an approved leave window

### Attendance & Leave

- Daily attendance check-in
- Employee attendance history view
- Admin attendance overview and employee-level attendance drill-down
- Submit leave requests
- Manager/admin approval workflow for pending leaves
- Leave approval step records via `LeaveApproval`
- Leave balance fields stored per user (`totalLeaves`, `usedLeaves`)

### Facilities & Seating

- Meeting room/facility booking requests
- Manager/admin approval or rejection of bookings
- Occupancy summary by facility zone with safety threshold alerts
- Seating assignment management by cubicle
- Enforcement to prevent a user being assigned to multiple cubicles

### Assets & Maintenance

- Admin asset inventory management
- Assign and unassign assets to employees
- Employee self-service asset view
- Asset custody history tracking
- Employee maintenance request submission
- Admin maintenance request resolution workflow
- Asset accountability reporting with custody duration

### Wellness, Workload & Communication

- Employee wellness check-ins with stress level, mood, and notes
- Manager wellness visibility for direct reports
- Employee feedback submission with anonymous option
- Admin/manager feedback review
- In-app notifications with read/unread updates
- Manager team announcements with notification fan-out to managed employees
- Admin overwork risk detection based on active and overdue tasks

## Tech Stack

### Frontend

- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Axios
- Lucide React

### Backend

- Node.js
- Express
- Sequelize ORM
- JWT (`jsonwebtoken`)
- bcryptjs

### Database

- PostgreSQL
- Supabase-hosted PostgreSQL connection is supported in the current server configuration

### DevOps / Tooling

- Nodemon
- ESLint
- PostCSS
- Autoprefixer

### APIs / Integrations

- REST API served from Express under `/api`
- JWT Authorization header for authenticated requests
- Render deployment is referenced in the frontend API client
- Supabase/PostgreSQL connection handling in the backend

## Architecture

The project uses a **monorepo structure** with a React single-page application in `client/` and an Express REST API in `server/`.

On the backend, the application follows a pragmatic layered structure:

- `routes/` for authentication routes
- `middleware/` for JWT protection and role authorization
- `models/` for Sequelize models and associations
- `server.js` as the main API composition layer

The system is best described as a **role-based client-server web application** using:

- SPA frontend
- REST API backend
- relational data model in PostgreSQL

### Request Flow

1. A user logs in through the React client.
2. The backend validates credentials and returns a JWT.
3. The client stores the token and sends it in the `Authorization` header for future API calls.
4. Protected Express routes use middleware to resolve the current user and enforce allowed roles.
5. Sequelize reads and writes data in PostgreSQL, including related records such as project members, leave approvals, notifications, and asset history.

## Project Structure

```text
Work_Space_Management/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   ├── Auth/
│   │   │   ├── Employee/
│   │   │   ├── Manager/
│   │   │   └── Shared/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── lib/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── seed/
│   ├── sql/
│   ├── supabase/
│   ├── package.json
│   └── server.js
└── .gitignore
```

### Important Directories

- `client/src/pages/`: role-specific and shared UI pages
- `client/src/contexts/`: authentication state management
- `client/src/api/`: Axios client configuration
- `server/models/`: Sequelize schema definitions and associations
- `server/routes/`: authentication endpoints
- `server/middleware/`: JWT auth and role authorization
- `server/seed/`: default demo data seeding
- `server/scripts/`: seed and backfill utilities
- `server/sql/`: SQL migration/helper scripts

## Installation & Setup

### Prerequisites

- Node.js 18+ recommended
- npm
- PostgreSQL database or a managed PostgreSQL instance such as Supabase

### Clone the Repository

```bash
git clone <your-repository-url>
cd Work_Space_Management
```

### Install Dependencies

```bash
cd client
npm install
```

```bash
cd ../server
npm install
```

### Environment Variables

Create a `server/.env` file with values similar to:

```env
PORT=5001
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

DATABASE_URL=postgresql://username:password@host:5432/database

DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
DB_SYNC=true

OVERWORK_OVERDUE_THRESHOLD=2
OVERWORK_SCORE_THRESHOLD=120
```

### Important Setup Notes

- The backend currently listens on **port `5001`** in `server/server.js`.
- The frontend Axios client currently points to a deployed API URL:

```js
https://worksphere-fpvi.onrender.com/api
```

- For local development, update `client/src/api/axios.js` to your local backend, for example:

```js
baseURL: "http://localhost:5001/api"
```

### Run the Backend

```bash
cd server
npm run dev
```

### Run the Frontend

```bash
cd client
npm run dev
```

### Seed Demo Data

```bash
cd server
npm run seed
```

### Optional Backfill Script

```bash
cd server
npm run backfill:assets
```

## Usage

### Start the Application

1. Start the backend server.
2. Start the Vite frontend.
3. Open the frontend URL shown by Vite in the terminal.
4. Log in with an existing account or create users through the admin flow.

### Example Workflows

#### Admin Workflow

- Add employees and assign their role, department, and manager
- Archive employees during offboarding
- Review attendance and feedback
- Manage assets and resolve maintenance requests
- Review overwork-risk alerts

#### Manager Workflow

- Create projects
- Add project members
- Assign tasks with due dates
- Approve or reject leave requests for direct reports
- Publish team announcements
- Monitor team wellness data

#### Employee Workflow

- View assigned projects and tasks
- Check in for attendance
- Apply for leave
- Book facilities
- View assigned assets and request maintenance
- Submit wellness check-ins and feedback
- Read notifications

## API Documentation

### Authentication

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and return JWT |
| `POST` | `/api/auth/forgot-password` | Generate a password reset token |
| `POST` | `/api/auth/reset-password` | Reset password using token |
| `GET` | `/api/me` | Get current authenticated user snapshot |

### Users

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/users` | List users for admin/manager |
| `PATCH` | `/api/users/:id` | Update role, department, archive state, manager |
| `DELETE` | `/api/users/:id` | Delete a user |

### Projects & Tasks

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/projects` | List projects based on role visibility |
| `POST` | `/api/projects` | Create a project |
| `POST` | `/api/projects/:id/members` | Add a member to a project |
| `POST` | `/api/projects/:projectId/add-employee` | Alias route for adding a project member |
| `GET` | `/api/projects/:id/employees` | Get project team members |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/project/:projectId` | List tasks for a project |
| `GET` | `/api/tasks/my` | List tasks assigned to current user |
| `PUT` | `/api/tasks/:id` | Update task status |
| `PATCH` | `/api/tasks/:id` | Alias route to update task status |

### Attendance & Leave

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/attendance/checkin` | Record daily attendance |
| `GET` | `/api/attendance/my` | Get current user attendance history |
| `GET` | `/api/admin/attendance` | Get admin attendance overview |
| `GET` | `/api/admin/attendance/:id` | Get attendance history for a user |
| `POST` | `/api/leave` | Submit leave request |
| `GET` | `/api/leave/my` | Get current user leave records |
| `GET` | `/api/leave/pending` | Get pending approvals for admin/manager |
| `PUT` | `/api/leave/:id` | Approve or reject leave |
| `POST` | `/api/leaves` | Alternate leave creation route |
| `GET` | `/api/leaves` | Alternate leave listing route |
| `PATCH` | `/api/leaves/:id` | Alternate leave update route |

### Facilities & Seating

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/facilities` | Create a facility booking request |
| `GET` | `/api/facilities` | List facility bookings |
| `PUT` | `/api/facilities/:id` | Approve or reject facility booking |
| `POST` | `/api/facilities/book` | Alternate booking route |
| `PATCH` | `/api/facilities/:id` | Alternate facility update route |
| `GET` | `/api/seating` | List seating assignments |
| `PATCH` | `/api/seating/:cubicleId` | Assign or clear a cubicle seat |
| `GET` | `/api/occupancy/today` | Get current occupancy by zone |

### Assets

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/assets` | List all assets for admin |
| `POST` | `/api/assets` | Create an asset |
| `PATCH` | `/api/assets/:id` | Update asset status or assignment |
| `GET` | `/api/assets/my` | Get assets assigned to current user |
| `POST` | `/api/assets/maintenance-request` | Submit maintenance request |
| `GET` | `/api/admin/asset-maintenance-requests` | List maintenance requests |
| `PATCH` | `/api/admin/asset-maintenance-requests/:id` | Resolve or reject maintenance request |
| `GET` | `/api/admin/assets/accountability` | Get asset accountability report |

### Wellness, Feedback & Notifications

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/feedback` | Submit feedback |
| `GET` | `/api/feedback` | Get feedback for current user context |
| `GET` | `/api/admin/feedback` | Review all feedback as admin/manager |
| `GET` | `/api/notifications` | List current user notifications |
| `PATCH` | `/api/notifications/:id` | Mark a notification as read |
| `GET` | `/api/manager/attendance/my` | Manager attendance history |
| `GET` | `/api/manager/wellness` | Manager wellness view for direct reports |
| `GET` | `/api/manager/announcements` | List manager-created announcements |
| `POST` | `/api/manager/announcements` | Create team announcement |
| `GET` | `/api/wellness/my` | Get current user wellness check-ins |
| `POST` | `/api/wellness/checkin` | Submit wellness check-in |
| `GET` | `/api/workload/my` | Get workload score for current user |
| `GET` | `/api/admin/workload/risks` | Get overwork risk report |

## Screenshots / Demo

> To be updated

Suggested additions:

- Login screen
- Admin dashboard
- Manager project/team management screen
- Employee assets and wellness pages

## Testing

Formal automated test suites were not found in the repository.

Available verification commands:

```bash
cd client
npm run lint
```

Backend testing scripts are **To be updated**.

## Future Improvements

- Add automated backend and frontend tests
- Move the frontend API base URL to environment variables instead of hardcoding the deployed URL
- Add complete API documentation with request/response examples
- Implement missing backend routes currently referenced by the UI, such as project progress update and admin stats
- Add email delivery for password reset instead of returning reset tokens in the API response
- Introduce migrations instead of relying on `sequelize.sync({ alter: true })` in production
- Add audit logs for approvals, booking updates, and asset assignment changes
- Add dashboards for global notices and feedback response threads already modeled in the database

## Contributors

Contributors detected from Git history:

- Asmita Ch
- D-Varshitha

## License

A license file was not found in the repository.

> Suggested license: MIT
