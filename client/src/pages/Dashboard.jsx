import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function getErrorMessage(err, fallback) {
  return (
    err.response?.data?.message ||
    (typeof err.response?.data === "string" ? err.response.data : null) ||
    err.message ||
    fallback
  );
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [summarizeState, setSummarizeState] = useState({
    taskId: null,
    loading: false,
    result: "",
  });
  const [summarizeError, setSummarizeError] = useState({
    taskId: null,
    message: "",
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editValues, setEditValues] = useState({ title: "", description: "" });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const { data } = await api.get("/tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setListError(
        getErrorMessage(err, "Could not load tasks. Please try again.")
      );
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    loadTasks();
  }, [token, navigate, loadTasks]);

  async function handleAddTask(e) {
    e.preventDefault();
    setFormError("");
    setActionError("");
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
      };
      const { data } = await api.post("/tasks", payload);
      setTasks((prev) => [data, ...prev]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Could not create task. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleCompleted(task) {
    setActionError("");
    try {
      const { data } = await api.put(`/tasks/${task._id}`, {
        completed: !task.completed,
      });
      setTasks((prev) =>
        prev.map((t) => (String(t._id) === String(data._id) ? data : t))
      );
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not update task. Please try again.")
      );
    }
  }

  async function deleteTask(id) {
    setActionError("");
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => String(t._id) !== String(id)));
    } catch (err) {
      setActionError(
        getErrorMessage(err, "Could not delete task. Please try again.")
      );
    }
  }

  async function summarizeTask(task) {
    setSummarizeError({ taskId: null, message: "" });
    setSummarizeState({
      taskId: String(task._id),
      loading: true,
      result: "",
    });

    try {
      const { data } = await api.post("/ai/summarize", {
        title: task.title,
        description: task.description || "",
      });

      setSummarizeState({
        taskId: String(task._id),
        loading: false,
        result: data?.summary || "",
      });
    } catch (err) {
      setSummarizeState({
        taskId:String(task._id),
        loading: false,
        result: "",
      });
      setSummarizeError({
        taskId: String(task._id),
        message: getErrorMessage(err, "Could not summarize this task."),
      });
    }
  }

function startEdit(task) {
  setEditingTaskId(task._id);
  setEditValues({ title: task.title, description: task.description || "" });
}

function cancelEdit() {
  setEditingTaskId(null);
  setEditValues({ title: "", description: "" });
}

async function saveEdit(taskId) {
  if (!editValues.title.trim()) return;
  try {
    const { data } = await api.put(`/tasks/${taskId}`, {
      title: editValues.title.trim(),
      description: editValues.description.trim(),
    });
    setTasks((prev) =>
      prev.map((t) => (String(t._id) === String(data._id) ? data : t))
    );
    setEditingTaskId(null);
    setEditValues({ title: "", description: "" });
  } catch (err) {
    setActionError(
      getErrorMessage(err, "Could not update task. Please try again.")
    );
  }
}

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.25),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <header
          className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-blue-900/40"
              aria-hidden
            >
              TW
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                TaskWise
              </h1>
              {user?.email ? (
                <p className="text-sm text-slate-400">{user.email}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:bg-white/10"
          >
            Log out
          </button>
        </header>

        <section
          className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06) inset, 0 25px 50px -12px rgba(0,0,0,0.5)",
          }}
        >
          <h2 className="mb-4 text-lg font-semibold text-white">New task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label
                htmlFor="task-title"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none ring-blue-500/40 transition focus:border-blue-500/50 focus:ring-2"
                placeholder="What needs to be done?"
              />
            </div>
            <div>
              <label
                htmlFor="task-description"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Description{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                id="task-description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-y rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none ring-blue-500/40 transition focus:border-blue-500/50 focus:ring-2"
                placeholder="Add details…"
              />
            </div>
            {formError ? (
              <p
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add task"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Your tasks</h2>
            {loading ? (
              <span className="text-sm text-slate-400">Loading…</span>
            ) : null}
          </div>
          {!loading && !listError && totalTasks > 0 ? (
            <div className="mb-4 inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 backdrop-blur">
              {completedTasks} / {totalTasks} tasks completed
            </div>
          ) : null}

          {listError ? (
            <p
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {listError}
            </p>
          ) : null}

          {actionError ? (
            <p
              className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-slate-400 backdrop-blur-xl">
              <div
                className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"
                aria-hidden
              />
              <p className="text-sm">Loading your tasks…</p>
            </div>
          ) : !listError && tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-slate-400 backdrop-blur-xl">
              No tasks yet. Add one above.
            </div>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 backdrop-blur-xl"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,0.06) inset, 0 10px 40px -15px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {editingTaskId === task._id ? (
                      // NEW - edit mode UI
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValues.title}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none ring-blue-500/40 transition focus:border-blue-500/50 focus:ring-2"
                          placeholder="Task title"
                        />
                        <textarea
                          rows={3}
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full resize-y rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none ring-blue-500/40 transition focus:border-blue-500/50 focus:ring-2"
                          placeholder="Description (optional)"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(task._id)}
                            disabled={!editValues.title.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!task.completed}
                              onChange={() => toggleCompleted(task)}
                              className="h-4 w-4 rounded border-white/20 bg-slate-900/80 text-blue-500 focus:ring-blue-500/50"
                            />
                            <span
                              className={`text-base font-medium ${
                                task.completed
                                  ? "text-slate-500 line-through"
                                  : "text-white"
                              }`}
                            >
                              {task.title}
                            </span>
                          </label>
                        </div>
                        {task.description ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                            {task.description}
                          </p>
                        ) : null}
                        {summarizeState.taskId === String(task._id) &&
                          summarizeState.result ? (
                            <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-100">
                              {summarizeState.result}
                            </div>
                          ) : null}
                      </>
                    )}
                      {summarizeError.taskId === task._id &&
                      summarizeError.message ? (
                        <p
                          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                          role="alert"
                        >
                          {summarizeError.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    {editingTaskId !== task._id && (
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-200 transition hover:bg-blue-500/20"
                      >
                        Edit
                      </button>
                    )}
                      <button
                        type="button"
                        onClick={() => summarizeTask(task)}
                        disabled={
                          summarizeState.loading &&
                          summarizeState.taskId === task._id
                        }
                        className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
                      >
                        {summarizeState.loading &&
                        summarizeState.taskId === task._id
                          ? "Summarizing..."
                          : "AI Summarize"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task._id)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
