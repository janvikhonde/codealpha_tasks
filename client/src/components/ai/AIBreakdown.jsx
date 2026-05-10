import { useState } from "react";
import api from "../../services/api";
import useBoardStore from "../../store/boardStore";

export default function AIBreakdown() {
  const { activeProject, createTask } = useBoardStore();

  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBreakdown = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    setResult([]);

    try {
      const res = await api.post("/ai/breakdown", { title, context });

      // safer access
      const subtasks = res?.data?.subtasks || [];

      if (!subtasks.length) {
        setError("No subtasks generated.");
      }

      setResult(subtasks);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "AI breakdown failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAll = async () => {
    if (!result.length || !activeProject) return;

    try {
      await createTask({
        title,
        project: activeProject._id,
        status: "todo",
        subtasks: result,
      });

      setTitle("");
      setContext("");
      setResult([]);
      alert("✅ Task created with AI-generated subtasks!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create task");
    }
  };

  return (
    <div className="p-6 max-w-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">
          ✨ AI Task Breakdown
        </h2>
        <p className="text-sm text-gray-500">
          Paste a vague task title — Claude will break it into actionable subtasks.
        </p>
      </div>

      {/* Input Card */}
      <div className="card space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Task title *
          </label>
          <input
            className="input"
            placeholder='e.g. "Build user authentication"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Extra context (optional)
          </label>
          <textarea
            className="input resize-none h-20"
            placeholder="Tech stack, constraints, notes..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <button
          onClick={handleBreakdown}
          disabled={loading || !title}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? "⏳ Claude is thinking..." : "✨ Generate Subtasks"}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Result */}
      {result.length > 0 && (
        <div className="card mt-4">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">
            Generated Subtasks
          </p>

          <ol className="space-y-2">
            {result.map((sub, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-brand font-mono text-xs mt-0.5">
                  {i + 1}.
                </span>
                {sub?.title || "Untitled subtask"}
              </li>
            ))}
          </ol>

          <button
            onClick={handleCreateAll}
            className="btn-primary w-full mt-4 text-sm"
          >
            Create Task with These Subtasks →
          </button>
        </div>
      )}
    </div>
  );
}