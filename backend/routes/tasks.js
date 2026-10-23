
import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

const allowedPriorities = ["Low", "Medium", "High"];
const allowedStatuses = ["Pending", "In Progress", "Completed"];

function validateTask(body) {
  const { projectId, name, priority, status, dueDate } = body;

  if (
    projectId === undefined ||
    projectId === null ||
    projectId === "" ||
    !Number.isInteger(Number(projectId)) ||
    Number(projectId) < 1
  ) {
    return "Please select a valid project.";
  }

  if (typeof name !== "string" || !name.trim()) {
    return "Task name is required.";
  }

  if (name.trim().length > 150) {
    return "Task name must be 150 characters or fewer.";
  }

  if (
    priority !== undefined &&
    !allowedPriorities.includes(priority)
  ) {
    return "Invalid task priority.";
  }

  if (
    status !== undefined &&
    !allowedStatuses.includes(status)
  ) {
    return "Invalid task status.";
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
    if (
      typeof dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`)) ||
      !new Date(`${dueDate}T00:00:00Z`)
        .toISOString()
        .startsWith(dueDate)
    ) {
      return "Please provide a valid due date.";
    }
  }

  return null;
}

// GET /api/tasks - List tasks belonging to the logged-in user.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.project_id AS "projectId",
         t.name,
         t.description,
         t.priority,
         t.status,
         t.due_date AS "dueDate",
         TO_CHAR(t.created_at, 'YYYY-MM-DD') AS "createdDate"
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       WHERE p.user_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error("List tasks failed:", error.message);
    res.status(500).json({ message: "Could not load tasks." });
  }
});

// GET /api/tasks/:id - Get one task owned by the logged-in user.
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.project_id AS "projectId",
         t.name,
         t.description,
         t.priority,
         t.status,
         t.due_date AS "dueDate",
         TO_CHAR(t.created_at, 'YYYY-MM-DD') AS "createdDate"
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Get task failed:", error.message);
    res.status(500).json({ message: "Could not load task." });
  }
});

// POST /api/tasks - Create a task.
router.post("/", async (req, res) => {
  const validationError = validateTask(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const {
    projectId,
    name,
    description = "",
    priority = "Medium",
    status = "Pending",
    dueDate = null,
  } = req.body;

  try {
    const project = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [Number(projectId), req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    const result = await pool.query(
      `INSERT INTO tasks
         (project_id, name, description, priority, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         project_id AS "projectId",
         name,
         description,
         priority,
         status,
         due_date AS "dueDate",
         TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdDate"`,
      [
        Number(projectId),
        name.trim(),
        typeof description === "string" ? description.trim() : "",
        priority,
        status,
        dueDate || null,
      ]
    );

    res.status(201).json({
      message: "Task created successfully.",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Create task failed:", error.message);
    res.status(500).json({ message: "Could not create task." });
  }
});

// PUT /api/tasks/:id - Update a task.
router.put("/:id", async (req, res) => {
  const validationError = validateTask(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const {
    projectId,
    name,
    description = "",
    priority = "Medium",
    status = "Pending",
    dueDate = null,
  } = req.body;

  try {
    const project = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [Number(projectId), req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }

    const result = await pool.query(
      `UPDATE tasks t
       SET project_id = $1,
           name = $2,
           description = $3,
           priority = $4,
           status = $5,
           due_date = $6
       FROM projects p
       WHERE t.id = $7
         AND t.project_id = p.id
         AND p.user_id = $8
       RETURNING
         t.id,
         t.project_id AS "projectId",
         t.name,
         t.description,
         t.priority,
         t.status,
         t.due_date AS "dueDate",
         TO_CHAR(t.created_at, 'YYYY-MM-DD') AS "createdDate"`,
      [
        Number(projectId),
        name.trim(),
        typeof description === "string" ? description.trim() : "",
        priority,
        status,
        dueDate || null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({
      message: "Task updated successfully.",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Update task failed:", error.message);
    res.status(500).json({ message: "Could not update task." });
  }
});

// DELETE /api/tasks/:id - Delete a task.
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tasks t
       USING projects p
       WHERE t.project_id = p.id
         AND t.id = $1
         AND p.user_id = $2
       RETURNING t.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task failed:", error.message);
    res.status(500).json({ message: "Could not delete task." });
  }
});

export default router;
