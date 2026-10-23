# ProjectFlow — Entity Relationship Diagram

The diagram below represents the database tables and their verified foreign-key relationships.

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ TASKS : contains

    USERS {
        integer id PK
        varchar full_name
        varchar email
        text password_hash
        timestamptz created_at
    }

    PROJECTS {
        integer id PK
        integer user_id FK
        varchar name
        text description
        varchar status
        date start_date
        date end_date
        timestamptz created_at
    }

    TASKS {
        integer id PK
        integer project_id FK
        varchar name
        text description
        varchar priority
        varchar status
        date due_date
        timestamptz created_at
    }
```

## Relationship explanation

- **Users to Projects:** One user can own multiple projects. Each project references its owner through `projects.user_id`.
- **Projects to Tasks:** One project can contain multiple tasks. Each task references its project through `tasks.project_id`.

## Cardinality

- `users.id` → `projects.user_id`: one-to-many.
- `projects.id` → `tasks.project_id`: one-to-many.

The foreign keys were verified against the PostgreSQL database.
