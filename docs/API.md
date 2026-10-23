# ProjectFlow — API Documentation

## Overview

The ProjectFlow backend is an Express.js REST API backed by PostgreSQL.

All endpoints use the `/api` prefix. Endpoints marked **Protected** require a valid JWT access token.

### Authentication

For protected endpoints, send the token in the HTTP header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens expire after two hours. The client must discard its token when logging out.

## 1. Health Check

| Method | Endpoint | Authentication |
|---|---|---|
| GET | `/api/health` | Check server configuration |

Checks whether the backend and database are available. The exact response depends on the health route implementation.

## 2. Authentication

### Register

`POST /api/auth/register`

Creates a user account and returns a JWT.

Request body:

```json
{
  "fullName": "Alex Kumar",
  "email": "alex@example.com",
  "password": "your-secure-password"
}
```

Success: `201 Created`

The response includes a message, a token, and the created user.

Possible errors:
- `400 Bad Request` — invalid name or email, or password shorter than 8 characters.
- `409 Conflict` — an account with that email already exists.
- `500 Internal Server Error` — registration failed.

### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "alex@example.com",
  "password": "your-secure-password"
}
```

Success: `200 OK`

Returns a message, JWT token, and user details.

Possible errors:
- `400 Bad Request` — email or password missing.
- `401 Unauthorized` — invalid credentials.
- `500 Internal Server Error` — login failed.

### Get Current User

`GET /api/auth/me`

**Protected.**

Returns the authenticated user's ID, full name, email, and account creation timestamp.

### Logout

`POST /api/auth/logout`

**Protected.**

Returns a logout confirmation message. Logout is stateless on the server, so the client must discard its token.

## 3. Dashboard

### Get Dashboard Statistics

`GET /api/dashboard`

**Protected.**

Returns these statistics for the logged-in user:

- `totalProjects`
- `totalTasks`
- `completedTasks`
- `pendingTasks`
- `projectsInProgress`

Example response:

```json
{
  "dashboard": {
    "totalProjects": 3,
    "totalTasks": 12,
    "completedTasks": 5,
    "pendingTasks": 4,
    "projectsInProgress": 2
  }
}
```

The numbers above are illustrative, not live database values.

## 4. Projects

All project endpoints are **Protected** and operate only on projects owned by the authenticated user.

### List Projects

`GET /api/projects`

Returns the user's projects, newest first.

### Get One Project

`GET /api/projects/:id`

Returns a project by ID.

Possible error: `404 Not Found` if the project does not exist or does not belong to the user.

### Create Project

`POST /api/projects`

Request body:

```json
{
  "name": "Website Redesign",
  "description": "Redesign the company website",
  "status": "Not Started",
  "startDate": "2026-10-25",
  "endDate": "2026-12-15"
}
```

Required field: `name`.

Optional fields: `description`, `status`, `startDate`, `endDate`.

Default status: `Not Started`.

Allowed statuses:
- `Not Started`
- `In Progress`
- `Completed`

Dates use `YYYY-MM-DD`. The end date cannot precede the start date.

Success: `201 Created`.

### Update Project

`PUT /api/projects/:id`

Uses the same request fields and validation as project creation. The supplied fields are written to the project; omitted optional fields use the route's defaults.

Success: `200 OK`.

Possible errors include `400 Bad Request`, `404 Not Found`, and `500 Internal Server Error`.

### Delete Project

`DELETE /api/projects/:id`

Deletes a project belonging to the authenticated user.

Success: `200 OK`.

Possible error: `404 Not Found`.

Note: Whether deleting a project also deletes its tasks depends on the database's foreign-key delete behavior.

## 5. Tasks

All task endpoints are **Protected**. Tasks are accessible only when their parent project belongs to the authenticated user.

### List Tasks

`GET /api/tasks`

Returns the logged-in user's tasks, newest first.

### Get One Task

`GET /api/tasks/:id`

Returns one task by ID.

Possible error: `404 Not Found` if the task does not exist or is not accessible to the user.

### Create Task

`POST /api/tasks`

Request body:

```json
{
  "projectId": 1,
  "name": "Create login page",
  "description": "Build the login screen",
  "priority": "High",
  "status": "Pending",
  "dueDate": "2026-11-05"
}
```

Required fields: `projectId`, `name`.

Optional fields: `description`, `priority`, `status`, `dueDate`.

Defaults:
- `priority`: `Medium`
- `status`: `Pending`

Allowed priorities: `Low`, `Medium`, `High`.

Allowed statuses: `Pending`, `In Progress`, `Completed`.

Dates use `YYYY-MM-DD`. The selected project must belong to the authenticated user.

Success: `201 Created`.

### Update Task

`PUT /api/tasks/:id`

Uses the same request fields and validation as task creation. The task's project can be changed to another project owned by the user.

Success: `200 OK`.

Possible errors include `400 Bad Request`, `404 Not Found`, and `500 Internal Server Error`.

### Delete Task

`DELETE /api/tasks/:id`

Deletes a task belonging to the authenticated user.

Success: `200 OK`.

Possible error: `404 Not Found`.

## 6. Common HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid or missing request data |
| 401 | Authentication required or invalid |
| 404 | Resource not found or not accessible |
| 409 | Duplicate email during registration |
| 500 | Server-side error |

## 7. Security Notes

- Passwords are hashed with bcrypt before being stored.
- Authentication uses JWT tokens signed by the backend.
- Protected endpoints must receive a valid bearer token.
- Project and task queries are scoped to the authenticated user.
- Keep `.env` files and JWT secrets private; never commit credentials to GitHub.

## Implementation Note

The endpoint paths above assume the route files are mounted in `server.js` under `/api/auth`, `/api/dashboard`, `/api/projects`, and `/api/tasks`. Confirm those mount paths in `server.js` before relying on this document.
