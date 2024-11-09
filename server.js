const express = require("express");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Ensure "public" directory for static files

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Define Task schema and model
const taskSchema = new mongoose.Schema({
  date: String,
  name: String,
  checked: { type: Boolean, default: false },
  comments: [{ text: String, date: { type: Date, default: Date.now } }]
});

const Task = mongoose.model("Task", taskSchema);

// GET all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error });
  }
});

// POST to add a new task
app.post("/api/tasks", async (req, res) => {
  const { date, name } = req.body;
  if (!date || !name) {
    return res.status(400).send("Date and task name are required.");
  }

  try {
    const newTask = new Task({ date, name });
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Error saving task", error });
  }
});

// POST to update checkmark state
app.post("/api/tasks/checkmark", async (req, res) => {
  const { id, checked } = req.body;
  if (!id || typeof checked !== "boolean") {
    return res.status(400).send("Task ID and checked state are required.");
  }

  try {
    const task = await Task.findByIdAndUpdate(id, { checked }, { new: true });
    if (!task) {
      return res.status(404).send("Task not found.");
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});

// POST to add a comment to a task
app.post("/api/tasks/comment", async (req, res) => {
  const { id, comment } = req.body;
  if (!id || !comment) {
    return res.status(400).send("Task ID and comment are required.");
  }

  try {
    const task = await Task.findByIdAndUpdate(
      id,
      { $push: { comments: { text: comment } } },
      { new: true }
    );
    if (!task) {
      return res.status(404).send("Task not found.");
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
});

// DELETE a task
app.delete("/api/tasks", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).send("Task ID is required.");
  }

  try {
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).send("Task not found.");
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
