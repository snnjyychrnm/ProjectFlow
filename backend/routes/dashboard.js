
import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard - Statistics for the logged-in user.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)
          FROM projects
          WHERE user_id = $1) AS "totalProjects",

         (SELECT COUNT(*)
          FROM tasks t
          INNER JOIN projects p ON p.id = t.project_id
          WHERE p.user_id = $1) AS "totalTasks",

         (SELECT COUNT(*)
          FROM tasks t
          INNER JOIN projects p ON p.id = t.project_id
          WHERE p.user_id = $1
            AND t.status = 'Completed') AS "completedTasks",

         (SELECT COUNT(*)
          FROM tasks t
          INNER JOIN projects p ON p.id = t.project_id
          WHERE p.user_id = $1
            AND t.status = 'Pending') AS "pendingTasks",

         (SELECT COUNT(*)
          FROM projects
          WHERE user_id = $1
            AND status = 'In Progress') AS "projectsInProgress"`,
      [req.user.id]
    );

    const row = result.rows[0];

    res.json({
      dashboard: {
        totalProjects: Number(row.totalProjects),
        totalTasks: Number(row.totalTasks),
        completedTasks: Number(row.completedTasks),
        pendingTasks: Number(row.pendingTasks),
        projectsInProgress: Number(row.projectsInProgress),
      },
    });
  } catch (error) {
    console.error("Load dashboard failed:", error.message);
    res.status(500).json({
      message: "Could not load dashboard statistics.",
    });
  }
});

export default router;
