document.addEventListener("DOMContentLoaded", () => {
    fetchTasks();
  });
  
  const socket = io();
  
  // Listen for real-time events from the server
  socket.on("taskAdded", (newTask) => {
    const container = document.getElementById(`tasks-container-${newTask.date}`);
    displayTask(container, newTask.date, newTask);
  });
  
  socket.on("taskUpdated", (updatedTask) => {
    const checkbox = document.querySelector(`#task-${updatedTask._id} input[type='checkbox']`);
    if (checkbox) checkbox.checked = updatedTask.checked;
  });
  
  socket.on("commentAdded", (updatedTask) => {
    const commentsDisplay = document.getElementById(`comments-display-${updatedTask._id}`);
    commentsDisplay.innerHTML = updatedTask.comments.map(comment => `<p>${comment.text}</p>`).join("");
  });
  
  socket.on("taskDeleted", ({ id }) => {
    const taskElement = document.getElementById(`task-${id}`);
    if (taskElement) {
      taskElement.remove();
    }
  });
  
  // Fetch all tasks from the backend on page load
  function fetchTasks() {
    fetch("/api/tasks")
      .then(response => response.json())
      .then(data => {
        data.forEach(task => {
          const container = document.getElementById(`tasks-container-${task.date}`);
          displayTask(container, task.date, task);
        });
      })
      .catch(error => console.error("Error fetching tasks:", error));
  }
  
  function displayTask(container, date, task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task-item";
    taskDiv.id = `task-${task._id}`;
  
    taskDiv.innerHTML = `
      <input type="checkbox" ${task.checked ? "checked" : ""} onchange="updateCheckmark('${task._id}', this.checked)">
      <label>${task.name}</label>
      <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
      <div class="comments-section">
        <textarea id="comment-box-${task._id}" placeholder="Add a comment..."></textarea>
        <button onclick="addComment('${task._id}')">Submit Comment</button>
        <div id="comments-display-${task._id}">
          ${task.comments.map(comment => `<p>${comment.text}</p>`).join("")}
        </div>
      </div>
    `;
  
    container.appendChild(taskDiv);
  }
  
  // Add a new task
  function addTask(date) {
    const taskInput = document.getElementById(`new-task-${date}`);
    const taskName = taskInput.value.trim();
    if (!taskName) return;
  
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name: taskName })
    })
    .then(() => taskInput.value = "")
    .catch(error => console.error("Error adding task:", error));
  }
  
  // Update checkmark status
  function updateCheckmark(taskId, checked) {
    fetch("/api/tasks/checkmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, checked })
    }).catch(error => console.error("Error updating checkmark:", error));
  }
  
  // Add a comment to a task
  function addComment(taskId) {
    const commentBox = document.getElementById(`comment-box-${taskId}`);
    const commentText = commentBox.value.trim();
    if (!commentText) return;
  
    fetch("/api/tasks/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, comment: commentText })
    })
    .then(() => commentBox.value = "")
    .catch(error => console.error("Error adding comment:", error));
  }
  
  // Delete a task
  function deleteTask(taskId) {
    fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId })
    }).catch(error => console.error("Error deleting task:", error));
  }
  