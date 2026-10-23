# ProjectFlow — Database Schema

## Overview

ProjectFlow uses PostgreSQL to store user accounts, projects, and tasks.
The database contains three tables: `users`, `projects`, and `tasks`.

## 1. users

Stores registered user accounts.

| Column | Data type | Nullable | Description |
|---|---|---|---|
| id | integer | No | User identifier; primary key |
| full_name | character varying | No | User's full name |
| email | character varying | No | User's email address |
| password_hash | text | No | Hashed password |
| created_at | timestamp with time zone | No | Account creation timestamp |

Passwords are hashed with bcrypt. The API does not return the password hash.

## 2. projects

Stores projects owned by users.

| Column | Data type | Nullable | Description |
|---|---|---|---|
| id | integer | No | Project identifier; primary key |
| user_id | integer | No | Owner; foreign key referencing `users.id` |
| name | character varying | No | Project name |
| description | text | Yes | Project description |
| status | character varying | No | Project status |
| start_date | date | Yes | Project start date |
| end_date | date | Yes | Project end date |
| created_at | timestamp with time zone | No | Project creation timestamp |

Supported project statuses in the API:
- `Not Started`
- `In Progress`
- `Completed`

## 3. tasks

Stores tasks associated with projects.

| Column | Data type | Nullable | Description |
|---|---|---|---|
| id | integer | No | Task identifier; primary key |
| project_id | integer | No | Parent project; foreign key referencing `projects.id` |
| name | character varying | No | Task name |
| description | text | Yes | Task description |
| priority | character varying | No | Task priority |
| status | character varying | No | Task status |
| due_date | date | Yes | Task due date |
| created_at | timestamp with time zone | No | Task creation timestamp |

Supported task priorities:
- `Low`
- `Medium`
- `High`

Supported task statuses:
- `Pending`
- `In Progress`
- `Completed`

## Relationships

1. `projects.user_id` references `users.id`.
   One user can own multiple projects.
2. `tasks.project_id` references `projects.id`.
   One project can contain multiple tasks.

The foreign-key constraints were verified against the PostgreSQL database.

## Notes

- Nullable fields are marked `Yes` in the tables above.
- The API scopes project and task operations to the authenticated user.
- This document describes the observed schema. It is not a database migration script.
- The exact column types and nullability were read from PostgreSQL's
  `information_schema.columns`.
