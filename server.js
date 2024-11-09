const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Ensure "public" directory for static files

// Load and save data from JSON file
const loadData = () => {
    if (!fs.existsSync("tasks.json")) {
        fs.writeFileSync("tasks.json", JSON.stringify({}), "utf8");
    }
    return JSON.parse(fs.readFileSync("tasks.json", "utf8"));
};

const saveData = (data) => fs.writeFileSync("tasks.json", JSON.stringify(data, null, 2), "utf8");

// GET all tasks
app.get("/api/tasks", (req, res) => {
    const data = loadData();
    res.json(data);
});

// POST to add a new task
app.post("/api/tasks", (req, res) => {
    const { date, name } = req.body;
    if (!date || !name) {
        return res.status(400).send("Date and task name are required.");
    }

    const data = loadData();
    const newTask = { id: uuidv4(), name, checked: false, comments: [] };

    if (!data[date]) {
        data[date] = [];
    }

    data[date].push(newTask);
    saveData(data);
    res.json(newTask);
});

// POST to update checkmark state
app.post("/api/tasks/checkmark", (req, res) => {
    const { date, id, checked } = req.body;
    if (!date || !id || typeof checked !== "boolean") {
        return res.status(400).send("Date, task ID, and checked state are required.");
    }

    const data = loadData();
    const dayTasks = data[date];
    if (!dayTasks) {
        return res.status(404).send("Day not found.");
    }

    const task = dayTasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).send("Task not found.");
    }

    task.checked = checked;
    saveData(data);
    res.sendStatus(200);
});

// POST to add a comment to a task
app.post("/api/tasks/comment", (req, res) => {
    const { date, id, comment } = req.body;
    if (!date || !id || !comment) {
        return res.status(400).send("Date, task ID, and comment are required.");
    }

    const data = loadData();
    const dayTasks = data[date];
    if (!dayTasks) {
        return res.status(404).send("Day not found.");
    }

    const task = dayTasks.find(task => task.id === id);
    if (!task) {
        return res.status(404).send("Task not found.");
    }

    task.comments.push(comment);
    saveData(data);
    res.sendStatus(200);
});

// DELETE a task
app.delete("/api/tasks", (req, res) => {
    const { date, id } = req.body;
    if (!date || !id) {
        return res.status(400).send("Date and task ID are required.");
    }

    const data = loadData();
    const dayTasks = data[date];
    if (!dayTasks) {
        return res.status(404).send("Day not found.");
    }

    const taskIndex = dayTasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
        return res.status(404).send("Task not found.");
    }

    dayTasks.splice(taskIndex, 1);

    if (dayTasks.length === 0) {
        delete data[date];
    }

    saveData(data);
    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

