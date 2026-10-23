
import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All project routes require authentication.
router.use(authenticateToken);

const allowedStatuses = [
  "Not Started",
  "In Progress",
  "Completed",
];

function validateProject(body) {
  const { name, status, startDate, endDate } = body;

  if (typeof name !== "string" || !name.trim()) {
    return "Project name is required.";
  }

  if (name.trim().length > 150) {
    return "Project name must be 150 characters or fewer.";
  }

  if (
    status !== undefined &&
    !allowedStatuses.includes(status)
  ) {
    return "Invalid project status.";
  }

  const validDate = (date) =>
    date === null ||
    date === "" ||
    (typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
      new Date(`${date}T00:00:00Z`)
        .toISOString()
        .startsWith(date));

  if (
    (startDate !== undefined && !validDate(startDate)) ||
    (endDate !== undefined && !validDate(endDate))
  ) {
    return "Please provide valid project dates.";
  }

  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    return "End date cannot be earlier than the start date.";
  }

  return null;
}

// GET /api/projects - List the logged-in user's projects.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         name,
         description,
         status,
         start_date AS "startDate",
         end_date AS "endDate",
         TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdDate"
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    console.error("List projects failed:", error.message);
    res.status(500).json({ message: "Could not load projects." });
  }
});

// GET /api/projects/:id - Get one project.
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         name,
         description,
         status,
         start_date AS "startDate",
         end_date AS "endDate",
         TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdDate"
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error("Get project failed:", error.message);
    res.status(500).json({ message: "Could not load project." });
  }
});

// POST /api/projects - Create a project.
router.post("/", async (req, res) => {
  const validationError = validateProject(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const {
    name,
    description = "",
    status = "Not Started",
    startDate = null,
    endDate = null,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO projects
         (user_id, name, description, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         name,
         description,
         status,
         start_date AS "startDate",
         end_date AS "endDate",
         TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdDate"`,
      [
        req.user.id,
        name.trim(),
        typeof description === "string" ? description.trim() : "",
        status,
        startDate || null,
        endDate || null,
      ]
    );

    res.status(201).json({
      message: "Project created successfully.",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Create project failed:", error.message);
    res.status(500).json({ message: "Could not create project." });
  }
});

// PUT /api/projects/:id - Update a project.
router.put("/:id", async (req, res) => {
  const validationError = validateProject(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const {
    name,
    description = "",
    status = "Not Started",
    startDate = null,
    endDate = null,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           status = $3,
           start_date = $4,
           end_date = $5
       WHERE id = $6 AND user_id = $7
       RETURNING
         id,
         name,
         description,
         status,
         start_date AS "startDate",
         end_date AS "endDate",
         TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdDate"`,
      [
        name.trim(),
        typeof description === "string" ? description.trim() : "",
        status,
        startDate || null,
        endDate || null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({
      message: "Project updated successfully.",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Update project failed:", error.message);
    res.status(500).json({ message: "Could not update project." });
  }
});

// DELETE /api/projects/:id - Delete a project.
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.json({ message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project failed:", error.message);
    res.status(500).json({ message: "Could not delete project." });
  }
});

export default router;
