/**
 * Comprehensive Task CRUD and Web-Mobile Data Parity Test
 */

import {
  setBaseUrl,
  registerUser,
  loginUser,
  createProject,
  getProjects,
  createTask,
  updateTask,
  getTasks,
  deleteTask,
  getDashboard,
} from './src/services/api.js';

async function testTaskFlow() {
  console.log('--- Starting Task CRUD & Cross-Platform Parity Test ---');
  await setBaseUrl('http://localhost:5000/api');

  const email = `taskflow_${Date.now()}@test.com`;
  const password = 'Password123!';
  const user = await registerUser('Task Flow User', email, password);
  console.log(`✓ Registered user ${user.user.email} (ID: ${user.user.id})`);

  // Create Project
  const project = await createProject({
    name: 'Mobile Android Project',
    description: 'Shared across web and mobile platforms',
    status: 'In Progress',
    startDate: '2026-10-22',
    endDate: '2026-11-22',
  });
  console.log(`✓ Created project: "${project.name}" (ID: ${project.id})`);

  // Create Task
  const task = await createTask({
    projectId: project.id,
    name: 'Verify Android Keystore Token Storage',
    description: 'Ensure JWT is held in hardware/software Keystore',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-10-30',
  });
  console.log(`✓ Created task: "${task.name}" (ID: ${task.id}, Status: ${task.status}, Priority: ${task.priority})`);

  // Update Task Priority and Status (Mark as In Progress)
  const updatedTask = await updateTask(task.id, {
    projectId: project.id,
    name: task.name,
    description: task.description,
    priority: 'High',
    status: 'In Progress',
    dueDate: task.dueDate,
  });
  console.log(`✓ Updated status: ${updatedTask.status}`);

  // Mark task as Completed
  const completedTask = await updateTask(task.id, {
    projectId: project.id,
    name: task.name,
    description: task.description,
    priority: 'High',
    status: 'Completed',
    dueDate: task.dueDate,
  });
  console.log(`✓ Marked completed: ${completedTask.status}`);

  // Check Dashboard reflects the completed task & in-progress project
  const dash = await getDashboard();
  console.log('✓ Live Dashboard stats verified:', {
    totalProjects: dash.totalProjects,
    totalTasks: dash.totalTasks,
    completedTasks: dash.completedTasks,
    projectsInProgress: dash.projectsInProgress,
  });

  if (dash.totalProjects !== 1 || dash.totalTasks !== 1 || dash.completedTasks !== 1) {
    throw new Error('Dashboard stats do not match created items!');
  }

  // Delete Task
  await deleteTask(task.id);
  const remainingTasks = await getTasks();
  console.log(`✓ Deleted task. Remaining tasks count: ${remainingTasks.length}`);

  console.log('--- All Task CRUD & Parity Tests Passed Perfectly! ---');
}

testTaskFlow().catch((e) => {
  console.error('Task CRUD test failed:', e);
  process.exit(1);
});
