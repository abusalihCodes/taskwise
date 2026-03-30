const express = require("express");
const { z } = require("zod");

const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

const taskCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
});

const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),
});

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = taskCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const task = await Task.create({
      ...parsed.data,
        userId: req.user.userId,
    });

    return res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const parsed = taskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      parsed.data,
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
