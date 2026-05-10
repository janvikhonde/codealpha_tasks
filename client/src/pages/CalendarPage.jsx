// 📁 client/src/pages/CalendarPage.jsx
import { useEffect, useState } from 'react';
import useBoardStore from '../store/boardStore';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PRIORITY_COLORS = {
  urgent: 'bg-red-900/60 text-red-300 border-l-2 border-red-500',
  high:   'bg-orange-900/60 text-orange-300 border-l-2 border-orange-500',
  medium: 'bg-brand/20 text-purple-300 border-l-2 border-brand',
  low:    'bg-dark-600 text-gray-400 border-l-2 border-gray-600',
};

export default function CalendarPage() {
  const { tasks, activeProject } = useBoardStore();
  const [activeTab, setActiveTab] = useState('Calendar');
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year  = current.getFullYear();
  const month = current.getMonth();

  // First day of month (0=Sun) and total days
  const firstDay   = new Date(year, month, 1).getDay();
  const totalDays  = new Date(year, month + 1, 0).getDate();

  // Tasks that have a due date in the current month
  const tasksThisMonth = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getTasksForDay = (day) =>
    tasksThisMonth.filter(
      (t) => new Date(t.dueDate).getDate() === day
    );

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-white">Calendar</h1>
              <p className="text-xs text-gray-600">{activeProject?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prev} className="btn-ghost px-3 py-1.5 text-sm">‹</button>
              <span className="text-sm font-medium text-white w-36 text-center">
                {MONTHS[month]} {year}
              </span>
              <button onClick={next} className="btn-ghost px-3 py-1.5 text-sm">›</button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Calendar grid */}
            <div className="flex-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-600 py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before month starts */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 rounded-lg bg-dark-800/30" />
                ))}

                {/* Day cells */}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1;
                  const dayTasks = getTasksForDay(day);
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`h-24 rounded-lg p-1.5 cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-brand bg-brand/10'
                          : isToday(day)
                          ? 'border-brand/40 bg-dark-700'
                          : 'border-dark-600 bg-dark-800 hover:border-dark-400'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday(day) ? 'bg-brand text-white' : 'text-gray-500'
                      }`}>
                        {day}
                      </div>

                      {/* Task dots */}
                      <div className="space-y-0.5 overflow-hidden">
                        {dayTasks.slice(0, 3).map((t) => (
                          <div
                            key={t._id}
                            className={`text-[9px] px-1 py-0.5 rounded truncate leading-tight ${
                              PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium
                            }`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[9px] text-gray-600">+{dayTasks.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side panel — tasks for selected day */}
            {selectedDay && (
              <div className="w-64 flex-shrink-0">
                <div className="card sticky top-0">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    {MONTHS[month]} {selectedDay}
                    <span className="text-xs text-gray-600 ml-2 font-normal">
                      {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
                    </span>
                  </h3>

                  {selectedTasks.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-6">No tasks due this day</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTasks.map((t) => (
                        <div
                          key={t._id}
                          className={`rounded-lg p-2.5 text-xs ${PRIORITY_COLORS[t.priority]}`}
                        >
                          <p className="font-medium text-gray-200 mb-1 leading-snug">{t.title}</p>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                              t.status === 'done'
                                ? 'bg-green-900/50 text-green-400'
                                : t.status === 'inprogress'
                                ? 'bg-purple-900/50 text-purple-400'
                                : 'bg-dark-600 text-gray-500'
                            }`}>
                              {t.status}
                            </span>
                            {t.assignee && (
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-semibold"
                                style={{ background: t.assignee.color, color: '#fff' }}
                              >
                                {t.assignee.initials}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 text-[10px] text-gray-600">
            <span className="font-medium text-gray-500">Priority:</span>
            {Object.entries(PRIORITY_COLORS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-sm inline-block border-l-2 ${v.split(' ').find(c=>c.startsWith('border-l'))}`} />
                {k}
              </span>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}