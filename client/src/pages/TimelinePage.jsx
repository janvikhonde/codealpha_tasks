// 📁 client/src/pages/TimelinePage.jsx
import { useState } from 'react';
import useBoardStore from '../store/boardStore';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const STATUS_COLOR = {
  todo:       'bg-gray-600',
  inprogress: 'bg-brand',
  review:     'bg-yellow-500',
  done:       'bg-green-500',
};

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-brand',
  low:    'bg-gray-500',
};

export default function TimelinePage() {
  const { tasks, activeProject } = useBoardStore();
  const [activeTab, setActiveTab] = useState('Timeline');
  const [filter, setFilter] = useState('all'); // all | todo | inprogress | review | done

  // Sprint boundaries
  const sprintStart = activeProject?.currentSprint?.startDate
    ? new Date(activeProject.currentSprint.startDate)
    : new Date();
  const sprintEnd = activeProject?.currentSprint?.endDate
    ? new Date(activeProject.currentSprint.endDate)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const sprintDays = Math.max(
    1,
    Math.ceil((sprintEnd - sprintStart) / (1000 * 60 * 60 * 24))
  );

  // Build day labels for header
  const dayLabels = Array.from({ length: sprintDays }, (_, i) => {
    const d = new Date(sprintStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Filter & sort tasks
  const filteredTasks = tasks
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => t.dueDate) // only tasks with due dates show on timeline
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const tasksNoDue = tasks.filter((t) => !t.dueDate && (filter === 'all' || t.status === filter));

  // Calculate bar position and width
  const getBar = (task) => {
    const start = sprintStart;
    const due   = new Date(task.dueDate);
    // Estimate start as sprint start or creation date (whichever is later and within sprint)
    const barStart = new Date(Math.max(start.getTime(), new Date(task.createdAt).getTime()));
    const barEnd   = new Date(Math.min(due.getTime(), sprintEnd.getTime()));

    const startOffset = Math.max(
      0,
      Math.floor((barStart - start) / (1000 * 60 * 60 * 24))
    );
    const duration = Math.max(
      1,
      Math.ceil((barEnd - barStart) / (1000 * 60 * 60 * 24)) + 1
    );

    const leftPct  = (startOffset / sprintDays) * 100;
    const widthPct = Math.min((duration / sprintDays) * 100, 100 - leftPct);

    return { leftPct, widthPct };
  };

  const today = new Date();
  const todayOffset = Math.floor((today - sprintStart) / (1000 * 60 * 60 * 24));
  const todayPct = Math.max(0, Math.min(100, (todayOffset / sprintDays) * 100));
  const showTodayLine = todayOffset >= 0 && todayOffset <= sprintDays;

  const CELL_W = 40; // px per day

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-semibold text-white">Timeline</h1>
              <p className="text-xs text-gray-600">
                {activeProject?.currentSprint?.name} ·{' '}
                {sprintStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {sprintEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            {/* Filter */}
            <div className="flex gap-1">
              {['all','todo','inprogress','review','done'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === s ? 'bg-brand text-white' : 'bg-dark-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'inprogress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Gantt chart */}
          <div className="card overflow-x-auto">
            <div style={{ minWidth: `${200 + sprintDays * CELL_W}px` }}>

              {/* Day header */}
              <div className="flex border-b border-dark-500 mb-1">
                <div className="w-48 flex-shrink-0 text-[10px] text-gray-600 pb-2 pr-3 font-medium">Task</div>
                <div className="flex-1 relative flex">
                  {dayLabels.map((d, i) => (
                    <div
                      key={i}
                      style={{ width: CELL_W }}
                      className={`flex-shrink-0 text-center text-[9px] pb-2 ${
                        d.toDateString() === today.toDateString()
                          ? 'text-brand font-semibold'
                          : d.getDay() === 0 || d.getDay() === 6
                          ? 'text-gray-700'
                          : 'text-gray-600'
                      }`}
                    >
                      {d.getDate()}
                      {i === 0 || d.getDate() === 1 ? (
                        <div>{d.toLocaleString('default', { month: 'short' })}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task rows */}
              {filteredTasks.length === 0 && tasksNoDue.length === 0 && (
                <div className="text-center py-12 text-gray-600 text-sm">
                  No tasks with due dates found. Add due dates to tasks to see them here.
                </div>
              )}

              {filteredTasks.map((task) => {
                const { leftPct, widthPct } = getBar(task);
                const progress =
                  task.subtasks?.length
                    ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
                    : task.status === 'done' ? 100 : 0;

                return (
                  <div key={task._id} className="flex items-center py-2 border-b border-dark-700/50 last:border-0 group hover:bg-dark-700/30 rounded">
                    {/* Task name */}
                    <div className="w-48 flex-shrink-0 pr-3 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                      <span className="text-xs text-gray-300 truncate">{task.title}</span>
                      {task.assignee && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold flex-shrink-0 ml-auto"
                          style={{ background: task.assignee.color, color: '#fff' }}
                        >
                          {task.assignee.initials}
                        </div>
                      )}
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative h-7">
                      {/* Grid lines */}
                      {dayLabels.map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-dark-600/40"
                          style={{ left: `${(i / sprintDays) * 100}%` }}
                        />
                      ))}

                      {/* Today line */}
                      {showTodayLine && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-brand/60 z-10"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}

                      {/* Task bar */}
                      <div
                        className={`absolute top-1 bottom-1 rounded flex items-center overflow-hidden ${STATUS_COLOR[task.status]}`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 24 }}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-0 bg-white/10 origin-left"
                          style={{ transform: `scaleX(${progress / 100})` }}
                        />
                        <span className="relative text-[9px] text-white/80 px-1.5 truncate font-medium">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Tasks without due dates */}
              {tasksNoDue.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-600">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">No due date</p>
                  {tasksNoDue.map((task) => (
                    <div key={task._id} className="flex items-center py-1.5 gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                      <span className="text-xs text-gray-500">{task.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ml-auto ${STATUS_COLOR[task.status]} text-white/70`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 text-[10px] text-gray-600">
            <span className="font-medium text-gray-500">Status:</span>
            {Object.entries(STATUS_COLOR).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-sm ${v}`} />
                {k === 'inprogress' ? 'In Progress' : k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
            <span className="flex items-center gap-1.5 ml-4">
              <span className="w-px h-3 bg-brand" /> Today
            </span>
          </div>

        </main>
      </div>
    </div>
  );
}