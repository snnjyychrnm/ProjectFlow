# ProjectFlow

ProjectFlow is a project and task management application with a web frontend, a mobile application, and a REST API backed by PostgreSQL.

## Project Structure

```text
project/
├── backend/                     # Express.js REST API
├── project-management-web/      # Web application
├── project-management-mobile/   # Expo / React Native application
├── docs/
│   ├── API.md                   # API endpoints and examples
│   ├── DATABASE_SCHEMA.md       # Database tables and columns
│   └── ER_DIAGRAM.md            # Entity relationship diagram
└── README.md
```

## Features

- User registration and login
- JWT-based authentication
- Project creation, viewing, updating, and deletion
- Task creation, viewing, updating, and deletion
- Task priority and status management
- Dashboard statistics
- PostgreSQL database integration
- Web and mobile application interfaces

## Technology Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- `pg` PostgreSQL client
- JSON Web Tokens (JWT)
- bcrypt password hashing

### Web
The web application is located in `project-management-web/`. See its README for the frontend framework, dependencies, and development instructions.

### Mobile
The mobile application is located in `project-management-mobile/` and uses Expo / React Native. See its README for the app-specific setup instructions.

## Documentation

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Entity Relationship Diagram](docs/ER_DIAGRAM.md)

## Prerequisites

Install the following before running the project locally:

- Node.js and npm
- PostgreSQL
- Git

Install any additional web and mobile tooling listed in their respective package files.

## Local Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd project
```

Replace the placeholder URL with your repository URL.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a local `.env` file in the `backend/` directory with the following variables:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
JWT_SECRET=replace_with_a_strong_random_secret_of_at_least_32_characters
```

Use the connection details for your own PostgreSQL instance. Do not commit this file or publish real credentials.

The database must contain the tables documented in [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md). This repository's schema documentation is not a database migration script.

Start the backend:

```bash
npm run dev
```

The backend normally listens on port `5000`.

Check the health endpoint at:

`http://localhost:5000/api/health`

A successful response indicates that the backend can connect to PostgreSQL.

### 3. Run the web application

Open a separate terminal:

```bash
cd project-management-web
npm install
npm run dev
```

Use the local URL printed by Vite. The backend currently allows browser requests from `http://localhost:5173`.

### 4. Run the mobile application

Open another terminal:

```bash
cd project-management-mobile
npm install
npx expo start
```

Follow the Expo instructions to launch the application on a device or emulator.

For a physical phone, configure the API base URL to use the computer's reachable LAN IP address while both devices are on the same network. Do not use `localhost` on the phone to reach the computer.

## Environment Variables

The backend requires the following environment variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend listening port |
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Secret used to sign authentication tokens |

Use environment variables supplied by your deployment provider for production.

## Security

- Never commit `.env` files, database passwords, or JWT secrets.
- Use a unique, strong JWT secret outside local development.
- Use HTTPS for deployed applications.
- Configure CORS to allow only the intended frontend origins.
- Keep user data scoped to the authenticated account.

## Deployment

Deployment is not documented as complete yet. The production frontend, backend, and PostgreSQL connection must be configured with their actual deployment URLs and environment variables.

## License

No project license has been specified yet.
