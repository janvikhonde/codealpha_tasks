import { Draggable } from '@hello-pangea/dnd';
import useBoardStore from '../../store/boardStore';

const PRIORITY_COLORS = {
  urgent: 'bg-red-900/40 text-red-400',
  high: 'bg-orange-900/40 text-orange-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-gray-800 text-gray-500',
};

const TAG_COLORS = [
  'bg-blue-900/40 text-blue-400',
  'bg-purple-900/40 text-purple-400',
  'bg-green-900/40 text-green-400',
  'bg-pink-900/40 text-pink-400',
];

export default function TaskCard({ task, index }) {
  const { selectTask, selectedTask } = useBoardStore();
  const isSelected = selectedTask?._id === task._id;
  const isBlocked = task.dependencies?.some((d) => d.status !== 'done');
  const progress = task.subtasks?.length
    ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
    : null;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => selectTask(task)}
          className={`rounded-lg p-3 border cursor-pointer transition-all text-left ${
            snapshot.isDragging
              ? 'shadow-xl rotate-1 border-brand/60 bg-dark-600'
              : isSelected
              ? 'border-brand bg-dark-600'
              : isBlocked
              ? 'border-l-2 border-l-red-500 border-dark-500 bg-dark-700'
              : 'border-dark-500 bg-dark-700 hover:border-dark-400'
          }`}
        >
          {/* Blocked label */}
          {isBlocked && (
            <p className="text-[10px] text-red-400 mb-1">
              Blocked by: {task.dependencies.find((d) => d.status !== 'done')?.title}
            </p>
          )}

          {/* Title */}
          <p className="text-xs font-medium text-gray-200 mb-2 leading-snug">{task.title}</p>

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.map((tag, i) => (
                <span key={tag} className={`tag ${TAG_COLORS[i % TAG_COLORS.length]}`}>{tag}</span>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {progress !== null && (
            <div className="mb-2">
              <div className="h-0.5 bg-dark-500 rounded-full">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            {task.dueDate && (
              <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
            {progress !== null && (
              <span className="text-gray-600">{progress}%</span>
            )}
            {task.priority && task.priority !== 'medium' && (
              <span className={`tag ${PRIORITY_COLORS[task.priority]} ml-auto`}>{task.priority}</span>
            )}
            {task.assignee && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ml-auto"
                style={{ background: task.assignee.color || '#6c63ff', color: '#fff' }}
                title={task.assignee.name}
              >
                {task.assignee.initials}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}