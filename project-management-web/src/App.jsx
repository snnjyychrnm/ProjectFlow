
import { useState, useEffect } from "react";
import AuthPage from "./AuthPage";
import { apiRequest, logoutUser, getCurrentUser } from "./api";

const emptyProjectForm = {
  name: "",
  description: "",
  status: "Not Started",
  startDate: "",
  endDate: "",
};

const emptyTaskForm = {
  projectId: "",
  name: "",
  description: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const className = status.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`status-badge status-${className}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      {priority}
    </span>
  );
}

export default function App() {
  // Authentication and session restoration
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser();

        if (!cancelled) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem("token");

        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load projects from the backend after authentication.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadProjects() {
      setProjectsLoading(true);
      setProjectsLoadError("");

      try {
        const data = await apiRequest("/projects");
        if (!cancelled) setProjects(data.projects || []);
      } catch (error) {
        if (!cancelled) {
          setProjectsLoadError(error.message || "Could not load projects.");
        }
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    }

    loadProjects();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Load tasks from the backend after authentication.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadTasks() {
      setTasksLoading(true);
      setTasksLoadError("");

      try {
        const data = await apiRequest("/tasks");
        if (!cancelled) setTasks(data.tasks || []);
      } catch (error) {
        if (!cancelled) {
          setTasksLoadError(error.message || "Could not load tasks.");
        }
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    }

    loadTasks();
    return () => { cancelled = true; };
  }, [isAuthenticated]);


  // Navigation
  const [activePage, setActivePage] = useState("Dashboard");

  // Project data and filters
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsLoadError, setProjectsLoadError] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");

  // Project form
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [projectError, setProjectError] = useState("");

  // Task data and filters
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksLoadError, setTasksLoadError] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("All");
  const [taskProjectFilter, setTaskProjectFilter] = useState("All");

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskError, setTaskError] = useState("");


  // Load dashboard statistics from PostgreSQL.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadDashboard() {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const data = await apiRequest("/dashboard");
        if (!cancelled) setDashboardStats(data.dashboard);
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error.message || "Could not load dashboard statistics."
          );
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [isAuthenticated, projects, tasks]);


  // Dashboard statistics
  const totalProjects = dashboardStats?.totalProjects ?? 0;
  const totalTasks = dashboardStats?.totalTasks ?? 0;
  const completedTasks = dashboardStats?.completedTasks ?? 0;
  const pendingTasks = dashboardStats?.pendingTasks ?? 0;
  const projectsInProgress = dashboardStats?.projectsInProgress ?? 0;

  // Project filtering
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(projectSearch.toLowerCase());

    const matchesStatus =
      projectStatusFilter === "All" ||
      project.status === projectStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Task filtering
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name
      .toLowerCase()
      .includes(taskSearch.toLowerCase());

    const matchesStatus =
      taskStatusFilter === "All" ||
      task.status === taskStatusFilter;

    const matchesPriority =
      taskPriorityFilter === "All" ||
      task.priority === taskPriorityFilter;

    const matchesProject =
      taskProjectFilter === "All" ||
      String(task.projectId) === taskProjectFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesProject
    );
  });

  // Navigation
  function changePage(page) {
    setActivePage(page);

    setShowProjectForm(false);
    setShowTaskForm(false);

    setProjectError("");
    setTaskError("");
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      // The token is removed by logoutUser even if the server is unreachable.
      console.error("Logout request failed:", error.message);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActivePage("Dashboard");
      setShowProjectForm(false);
      setShowTaskForm(false);
      setProjectError("");
      setTaskError("");
    }
  }

  // Project operations
  function openCreateProject() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setProjectError("");
    setShowProjectForm(true);
  }

  function openEditProject(project) {
    setEditingProjectId(project.id);

    setProjectForm({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    });

    setProjectError("");
    setShowProjectForm(true);
  }

  async function saveProject(event) {
    event.preventDefault();

    const name = projectForm.name.trim();

    if (!name) {
      setProjectError("Project name is required.");
      return;
    }

    if (
      projectForm.startDate &&
      projectForm.endDate &&
      projectForm.endDate < projectForm.startDate
    ) {
      setProjectError("End date cannot be earlier than the start date.");
      return;
    }

    const projectData = { ...projectForm, name };
    setProjectError("");

    try {
      if (editingProjectId !== null) {
        const data = await apiRequest(`/projects/${editingProjectId}`, {
          method: "PUT",
          body: JSON.stringify(projectData),
        });

        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            String(project.id) === String(editingProjectId)
              ? data.project
              : project
          )
        );
      } else {
        const data = await apiRequest("/projects", {
          method: "POST",
          body: JSON.stringify(projectData),
        });

        setProjects((currentProjects) => [data.project, ...currentProjects]);
      }

      setShowProjectForm(false);
      setEditingProjectId(null);
      setProjectForm(emptyProjectForm);
    } catch (error) {
      setProjectError(error.message || "Could not save the project.");
    }
  }

  async function deleteProject(projectId) {
    const hasTasks = tasks.some(
      (task) => String(task.projectId) === String(projectId)
    );

    const message = hasTasks
      ? "This project has tasks. Delete the project and all its tasks?"
      : "Are you sure you want to delete this project?";

    if (!window.confirm(message)) return;

    try {
      await apiRequest(`/projects/${projectId}`, { method: "DELETE" });
      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => String(project.id) !== String(projectId)
        )
      );
      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => String(task.projectId) !== String(projectId)
        )
      );
    } catch (error) {
      alert(error.message || "Could not delete the project.");
    }
  }

  // Task operations
  function openCreateTask() {
    if (projects.length === 0) {
      setTaskError("Create a project before adding a task.");
      setShowTaskForm(false);
      return;
    }

    setEditingTaskId(null);

    setTaskForm({
      ...emptyTaskForm,
      projectId:
        taskProjectFilter !== "All"
          ? taskProjectFilter
          : String(projects[0].id),
    });

    setTaskError("");
    setShowTaskForm(true);
  }

  function openEditTask(task) {
    setEditingTaskId(task.id);

    setTaskForm({
      projectId: String(task.projectId),
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });

    setTaskError("");
    setShowTaskForm(true);
  }

  async function saveTask(event) {
    event.preventDefault();

    const name = taskForm.name.trim();

    if (!name) {
      setTaskError("Task name is required.");
      return;
    }

    if (
      !taskForm.projectId ||
      !projects.some(
        (project) => String(project.id) === String(taskForm.projectId)
      )
    ) {
      setTaskError("Please select a valid project.");
      return;
    }

    const taskData = {
      ...taskForm,
      name,
      projectId: Number(taskForm.projectId),
    };
    setTaskError("");

    try {
      if (editingTaskId !== null) {
        const data = await apiRequest(`/tasks/${editingTaskId}`, {
          method: "PUT",
          body: JSON.stringify(taskData),
        });

        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            String(task.id) === String(editingTaskId) ? data.task : task
          )
        );
      } else {
        const data = await apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(taskData),
        });
        setTasks((currentTasks) => [...currentTasks, data.task]);
      }

      setShowTaskForm(false);
      setEditingTaskId(null);
      setTaskForm(emptyTaskForm);
    } catch (error) {
      setTaskError(error.message || "Could not save the task.");
    }
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await apiRequest(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => String(task.id) !== String(taskId))
      );
    } catch (error) {
      alert(error.message || "Could not delete the task.");
    }
  }

  async function toggleTaskCompleted(taskId) {
    const task = tasks.find((item) => String(item.id) === String(taskId));
    if (!task) return;

    const updatedStatus =
      task.status === "Completed" ? "Pending" : "Completed";

    try {
      const data = await apiRequest(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          projectId: Number(task.projectId),
          name: task.name,
          description: task.description || "",
          priority: task.priority,
          status: updatedStatus,
          dueDate: task.dueDate || null,
        }),
      });

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          String(item.id) === String(taskId) ? data.task : item
        )
      );
    } catch (error) {
      alert(error.message || "Could not update task status.");
    }
  }

  // Restore the saved login before showing the app.
  if (authLoading) {
    return <main className="auth-page">Loading ProjectFlow...</main>;
  }

  // Show the authentication screen when no valid session exists.
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">P</div>
          <span>ProjectFlow</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={
              activePage === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => changePage("Dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              activePage === "Projects"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => changePage("Projects")}
          >
            <span>▤</span>
            Projects
          </button>

          <button
            type="button"
            className={
              activePage === "Tasks"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => changePage("Tasks")}
          >
            <span>☑</span>
            Tasks
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {(currentUser?.full_name || "User").charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{currentUser?.full_name || "User"}</strong>
            <span>{currentUser?.email || ""}</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </aside>

      <main className="main-content">
        {/* Dashboard */}
        {activePage === "Dashboard" && (
          <>
            {dashboardLoading && <p>Loading dashboard...</p>}
            {dashboardError && <p className="form-error">{dashboardError}</p>}
            <header className="page-header">
              <div>
                <h1>Dashboard</h1>
                <p>Overview of your projects and tasks.</p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  changePage("Projects");
                  openCreateProject();
                }}
              >
                + New Project
              </button>
            </header>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">▤</div>
                <p>Total Projects</p>
                <h2>{totalProjects}</h2>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">☑</div>
                <p>Total Tasks</p>
                <h2>{totalTasks}</h2>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <p>Completed Tasks</p>
                <h2>{completedTasks}</h2>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">◷</div>
                <p>Pending Tasks</p>
                <h2>{pendingTasks}</h2>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">↗</div>
                <p>Projects In Progress</p>
                <h2>{projectsInProgress}</h2>
              </div>
            </section>

            <section className="content-card">
              <div className="section-heading">
                <div>
                  <h2>Recent Projects</h2>
                  <p>Overview of your latest projects.</p>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => changePage("Projects")}
                >
                  View all
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="empty-state">
                  <h3>No projects yet</h3>
                  <p>Create a project to get started.</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      changePage("Projects");
                      openCreateProject();
                    }}
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {[...projects]
                        .sort(
                          (a, b) =>
                            (b.createdDate || "").localeCompare(a.createdDate || "")
                        )
                        .slice(0, 5)
                        .map((project) => (
                          <tr key={project.id}>
                            <td>
                              <strong>{project.name}</strong>
                              <p className="project-description">
                                {project.description || "No description"}
                              </p>
                            </td>
                            <td>
                              <StatusBadge status={project.status} />
                            </td>
                            <td>{formatDate(project.startDate)}</td>
                            <td>{formatDate(project.endDate)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Projects */}
        {activePage === "Projects" && (
          <>
            {projectsLoading && <p>Loading projects...</p>}
            {projectsLoadError && <p className="form-error">{projectsLoadError}</p>}
            <header className="page-header">
              <div>
                <h1>Projects</h1>
                <p>Create, view, update and manage your projects.</p>
              </div>

              {!showProjectForm && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={openCreateProject}
                >
                  + New Project
                </button>
              )}
            </header>

            {showProjectForm && (
              <section className="content-card project-form-card">
                <div className="section-heading">
                  <div>
                    <h2>
                      {editingProjectId !== null
                        ? "Edit Project"
                        : "Create Project"}
                    </h2>
                    <p>Enter the project details below.</p>
                  </div>
                </div>

                <form onSubmit={saveProject} className="project-form">
                  <div className="form-grid">
                    <label>
                      Project Name *
                      <input
                        type="text"
                        value={projectForm.name}
                        onChange={(event) =>
                          setProjectForm({
                            ...projectForm,
                            name: event.target.value,
                          })
                        }
                        placeholder="Enter project name"
                        required
                      />
                    </label>

                    <label>
                      Status
                      <select
                        value={projectForm.status}
                        onChange={(event) =>
                          setProjectForm({
                            ...projectForm,
                            status: event.target.value,
                          })
                        }
                      >
                        <option>Not Started</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </label>

                    <label className="full-width">
                      Description
                      <textarea
                        value={projectForm.description}
                        onChange={(event) =>
                          setProjectForm({
                            ...projectForm,
                            description: event.target.value,
                          })
                        }
                        placeholder="Describe the project"
                        rows="3"
                      />
                    </label>

                    <label>
                      Start Date
                      <input
                        type="date"
                        value={projectForm.startDate}
                        onChange={(event) =>
                          setProjectForm({
                            ...projectForm,
                            startDate: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      End Date
                      <input
                        type="date"
                        min={projectForm.startDate || undefined}
                        value={projectForm.endDate}
                        onChange={(event) =>
                          setProjectForm({
                            ...projectForm,
                            endDate: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  {projectError && (
                    <p className="form-error">{projectError}</p>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowProjectForm(false);
                        setProjectError("");
                      }}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="primary-button">
                      {editingProjectId !== null
                        ? "Save Changes"
                        : "Create Project"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="content-card">
              <div className="project-filters">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search projects by name..."
                  value={projectSearch}
                  onChange={(event) =>
                    setProjectSearch(event.target.value)
                  }
                />

                <select
                  className="filter-select"
                  value={projectStatusFilter}
                  onChange={(event) =>
                    setProjectStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="section-heading">
                <div>
                  <h2>All Projects</h2>
                  <p>{filteredProjects.length} project(s) found</p>
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <h3>No projects found</h3>
                  <p>Try changing your search or filters.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id}>
                          <td>
                            <strong>{project.name}</strong>
                            <p className="project-description">
                              {project.description || "No description"}
                            </p>
                          </td>

                          <td>
                            <StatusBadge status={project.status} />
                          </td>

                          <td>{formatDate(project.startDate)}</td>
                          <td>{formatDate(project.endDate)}</td>
                          <td>{formatDate(project.createdDate)}</td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => openEditProject(project)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() => deleteProject(project.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Tasks */}
        {activePage === "Tasks" && (
          <>
            {tasksLoading && <p>Loading tasks...</p>}
            {tasksLoadError && <p className="form-error">{tasksLoadError}</p>}
            <header className="page-header">
              <div>
                <h1>Tasks</h1>
                <p>Organize tasks, priorities and due dates.</p>
              </div>

              {!showTaskForm && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={openCreateTask}
                >
                  + New Task
                </button>
              )}
            </header>

            {showTaskForm && (
              <section className="content-card project-form-card">
                <div className="section-heading">
                  <div>
                    <h2>
                      {editingTaskId !== null ? "Edit Task" : "Create Task"}
                    </h2>
                    <p>Enter the task details below.</p>
                  </div>
                </div>

                <form onSubmit={saveTask} className="project-form">
                  <div className="form-grid">
                    <label>
                      Project *
                      <select
                        value={taskForm.projectId}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            projectId: event.target.value,
                          })
                        }
                        required
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option
                            key={project.id}
                            value={String(project.id)}
                          >
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Task Name *
                      <input
                        type="text"
                        value={taskForm.name}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            name: event.target.value,
                          })
                        }
                        placeholder="Enter task name"
                        required
                      />
                    </label>

                    <label className="full-width">
                      Description
                      <textarea
                        value={taskForm.description}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            description: event.target.value,
                          })
                        }
                        placeholder="Describe the task"
                        rows="3"
                      />
                    </label>

                    <label>
                      Priority
                      <select
                        value={taskForm.priority}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            priority: event.target.value,
                          })
                        }
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </label>

                    <label>
                      Status
                      <select
                        value={taskForm.status}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            status: event.target.value,
                          })
                        }
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    </label>

                    <label>
                      Due Date
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(event) =>
                          setTaskForm({
                            ...taskForm,
                            dueDate: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>

                  {taskError && (
                    <p className="form-error">{taskError}</p>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setShowTaskForm(false);
                        setTaskError("");
                      }}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="primary-button">
                      {editingTaskId !== null
                        ? "Save Changes"
                        : "Create Task"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="content-card">
              <div className="task-filters">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search tasks by name..."
                  value={taskSearch}
                  onChange={(event) => setTaskSearch(event.target.value)}
                />

                <select
                  className="filter-select"
                  value={taskStatusFilter}
                  onChange={(event) =>
                    setTaskStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  className="filter-select"
                  value={taskPriorityFilter}
                  onChange={(event) =>
                    setTaskPriorityFilter(event.target.value)
                  }
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  className="filter-select"
                  value={taskProjectFilter}
                  onChange={(event) =>
                    setTaskProjectFilter(event.target.value)
                  }
                >
                  <option value="All">All Projects</option>
                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={String(project.id)}
                    >
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="section-heading">
                <div>
                  <h2>All Tasks</h2>
                  <p>{filteredTasks.length} task(s) found</p>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <h3>No tasks found</h3>
                  <p>Try changing your search or filters.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTasks.map((task) => {
                        const project = projects.find(
                          (item) => item.id === task.projectId
                        );

                        return (
                          <tr key={task.id}>
                            <td>
                              <strong>{task.name}</strong>
                              <p className="project-description">
                                {task.description || "No description"}
                              </p>
                            </td>

                            <td>{project?.name || "Unknown project"}</td>

                            <td>
                              <PriorityBadge priority={task.priority} />
                            </td>

                            <td>
                              <StatusBadge status={task.status} />
                            </td>

                            <td>{formatDate(task.dueDate)}</td>
                            <td>{formatDate(task.createdDate)}</td>

                            <td>
                              <div className="task-actions">
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() =>
                                    toggleTaskCompleted(task.id)
                                  }
                                >
                                  {task.status === "Completed"
                                    ? "Reopen"
                                    : "Complete"}
                                </button>

                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => openEditTask(task)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() => deleteTask(task.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
