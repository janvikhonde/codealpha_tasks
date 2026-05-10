import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import useBoardStore from '../../store/boardStore';
import TaskColumn from './TaskColumn';
import NewTaskModal from '../task/NewTaskModal';
import { useState } from 'react';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#888' },
  { id: 'inprogress', label: 'In Progress', color: '#6c63ff' },
  { id: 'review', label: 'Review', color: '#e0a040' },
  { id: 'done', label: 'Done', color: '#4cbf9a' },
];

export default function KanbanBoard() {
  const { tasks, activeProject, reorderTasks } = useBoardStore();
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assignee?._id !== filterAssignee) return false;
    return true;
  });

  const getColumnTasks = (colId) =>
    filteredTasks.filter((t) => t.status === colId).sort((a, b) => a.order - b.order);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const colId = destination.droppableId;
    const colTasks = getColumnTasks(colId).filter((t) => t._id !== draggableId);
    colTasks.splice(destination.index, 0, { _id: draggableId });

    const reordered = colTasks.map((t, i) => ({ _id: t._id, status: colId, order: i }));
    // also include the task's old column if it moved
    if (source.droppableId !== colId) {
      const srcTasks = getColumnTasks(source.droppableId).filter((t) => t._id !== draggableId);
      srcTasks.forEach((t, i) => reordered.push({ _id: t._id, status: source.droppableId, order: i }));
    }

    await reorderTasks(activeProject._id, reordered);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sprint header */}
      <div className="flex items-center gap-4 px-5 pt-4 pb-2 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-white">{activeProject?.currentSprint?.name || 'Board'}</h2>
          <p className="text-xs text-gray-600">{tasks.length} tasks · {activeProject?.members?.length} members</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Priority filter */}
          <select
            className="input text-xs py-1 w-28"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => setShowNewTask(true)}
            className="btn-primary text-xs py-1 px-3"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 px-5 pb-4 overflow-x-auto flex-1 items-start pt-2">
          {COLUMNS.map((col) => (
            <TaskColumn
              key={col.id}
              column={col}
              tasks={getColumnTasks(col.id)}
            />
          ))}
        </div>
      </DragDropContext>

      {showNewTask && (
        <NewTaskModal onClose={() => setShowNewTask(false)} />
      )}
    </div>
  );
}