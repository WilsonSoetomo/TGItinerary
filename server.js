require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const http = require("http"); // Use http to create server
const mongoose = require("mongoose");
const path = require("path");
const socketIo = require("socket.io"); // Import socket.io

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Ensure "public" directory for static files

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
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
  comments: [{ text: String, date: { type: Date, default: Date.now } }],
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
    io.emit("taskAdded", newTask); // Emit real-time update
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
    io.emit("taskUpdated", task); // Emit real-time update
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
    io.emit("commentAdded", task); // Emit real-time update
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
    io.emit("taskDeleted", { id }); // Emit real-time update
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
});

// Handle client connections and disconnections
io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
