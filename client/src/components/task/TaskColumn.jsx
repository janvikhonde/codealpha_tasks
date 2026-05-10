import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

export default function TaskColumn({ column, tasks }) {
  return (
    <div className="w-52 flex-shrink-0 flex flex-col bg-dark-800 rounded-xl border border-dark-500">
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
        <span className="text-xs font-medium text-gray-300">{column.label}</span>
        <span className="ml-auto text-[10px] bg-dark-600 text-gray-500 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-20 p-2 pt-1 space-y-2 rounded-b-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-brand/5' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task._id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}