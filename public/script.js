document.addEventListener("DOMContentLoaded", () => {
    fetchTasks();
});

// Fetch all tasks from the backend on page load
function fetchTasks() {
    fetch("/api/tasks")
        .then(response => response.json())
        .then(data => {
            Object.keys(data).forEach(date => {
                const container = document.getElementById(`tasks-container-${date}`);
                container.innerHTML = ""; // Clear existing items
                data[date].forEach(task => displayTask(container, date, task));
            });
        })
        .catch(error => console.error("Error fetching tasks:", error));
}

function displayTask(container, date, task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task-item";
    taskDiv.id = `task-${task.id}`;  // Set a unique ID for each task element

    taskDiv.innerHTML = `
        <input type="checkbox" id="${task.id}" ${task.checked ? "checked" : ""}>
        <label for="${task.id}">${task.name}</label>
        <button class="delete-btn" onclick="deleteTask('${date}', '${task.id}')">Delete</button>
        <div class="comments-section">
            <textarea id="comment-box-${task.id}" placeholder="Add a comment..."></textarea>
            <button onclick="addComment('${date}', '${task.id}')">Submit Comment</button>
            <div id="comments-display-${task.id}">
                ${task.comments.map(comment => `<p>${comment}</p>`).join("")}
            </div>
        </div>
    `;

    const checkbox = taskDiv.querySelector("input[type='checkbox']");
    checkbox.addEventListener("change", () => updateCheckmark(date, task.id, checkbox.checked));

    container.appendChild(taskDiv);
}


// Add a new task for a specific day
function addTask(date) {
    const taskInput = document.getElementById(`new-task-${date}`);
    const taskName = taskInput.value.trim();
    if (!taskName) return;

    fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, name: taskName })
    })
    .then(response => response.json())
    .then(newTask => {
        const container = document.getElementById(`tasks-container-${date}`);
        displayTask(container, date, newTask); // Display the new task immediately
        taskInput.value = ""; // Clear input
    })
    .catch(error => console.error("Error adding task:", error));
}

// Update the checkmark status of a task
function updateCheckmark(date, taskId, checked) {
    fetch("/api/tasks/checkmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id: taskId, checked })
    })
    .catch(error => console.error("Error updating checkmark:", error));
}

// Add a comment to a task
function addComment(date, taskId) {
    const commentBox = document.getElementById(`comment-box-${taskId}`);
    const commentText = commentBox.value.trim();
    if (!commentText) return;

    fetch("/api/tasks/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id: taskId, comment: commentText })
    })
    .then(() => {
        // Append the new comment to the comments display
        const commentsDisplay = document.getElementById(`comments-display-${taskId}`);
        const newComment = document.createElement("p");
        newComment.textContent = commentText;
        commentsDisplay.appendChild(newComment);
        commentBox.value = ""; // Clear comment box
    })
    .catch(error => console.error("Error adding comment:", error));
}

// Delete a task
function deleteTask(date, taskId) {
    fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id: taskId })
    })
    .then(response => {
        if (response.ok) {
            // Remove the task from the DOM
            const taskElement = document.getElementById(`task-${taskId}`);
            if (taskElement) {
                taskElement.remove();
            }
        } else {
            console.error("Failed to delete task.");
        }
    })
    .catch(error => console.error("Error deleting task:", error));
}

