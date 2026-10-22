const mongoose = require('mongoose');
const Task = require('../models/Task');
const { wrap, HttpError } = require('../middleware/error');

const MAX_LIMIT = 50;

// Accept only known string fields (also blocks NoSQL operator objects).
const pick = (body) => {
  const out = {};
  for (const k of ['title', 'description', 'status']) if (typeof body[k] === 'string') out[k] = body[k];
  if (body.dueDate === '' || body.dueDate === null) out.dueDate = null;
  else if (typeof body.dueDate === 'string') {
    if (Number.isNaN(Date.parse(body.dueDate))) throw new HttpError(400, 'Invalid due date');
    out.dueDate = body.dueDate;
  }
  return out;
};

// Ownership check: every query is scoped to the logged-in user.
const findOwned = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Task not found');
  const task = await Task.findOne({ _id: id, user: userId });
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
};

exports.list = wrap(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
  const filter = { user: req.userId };
  if (['todo', 'done'].includes(req.query.status)) filter.status = req.query.status;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(filter),
  ]);
  res.json({ tasks, page, limit, total, pages: Math.ceil(total / limit) });
});

exports.create = wrap(async (req, res) => {
  const data = pick(req.body);
  if (!data.title || !data.title.trim()) throw new HttpError(400, 'Title is required');
  const task = await Task.create({ ...data, user: req.userId });
  res.status(201).json(task);
});

exports.update = wrap(async (req, res) => {
  const task = await findOwned(req.params.id, req.userId);
  const data = pick(req.body);
  if ('title' in data && !data.title.trim()) throw new HttpError(400, 'Title is required');
  Object.assign(task, data);
  await task.save();
  res.json(task);
});

exports.remove = wrap(async (req, res) => {
  const task = await findOwned(req.params.id, req.userId);
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
});
