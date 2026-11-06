import { useRef } from 'react'
import { useDraggable, useDroppable, DndContext, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'

export const COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'done', title: 'Done' },
]

function TaskCard({ task, onOpen }) {
  const suppressClick = useRef(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  if (isDragging) {
    suppressClick.current = true
  }
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'task-card--dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false
          return
        }
        onOpen(task)
      }}
    >
      <div className="task-card__top">
        <h3>{task.title}</h3>
        <span className={`task-card__priority task-card__priority--${task.priority}`}>
          {task.priority}
        </span>
      </div>
      {task.description ? <p>{task.description}</p> : null}
    </article>
  )
}

function Column({ column, tasks, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <header>
        <h2>{column.title}</h2>
        <span>{tasks.length}</span>
      </header>
      <div className="kanban-column__list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}

function KanbanBoard({ tasks, onOpenTask, onMoveTask }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) {
      return
    }

    const activeTask = tasks.find((task) => task.id === active.id)
    if (!activeTask) {
      return
    }

    const overColumn = COLUMNS.find((column) => column.id === over.id)
    const overTask = tasks.find((task) => task.id === over.id)
    const nextStatus = overColumn?.id || overTask?.status
    if (nextStatus && nextStatus !== activeTask.status) {
      onMoveTask(activeTask.id, nextStatus)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="kanban">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.status === column.id)}
            onOpen={onOpenTask}
          />
        ))}
      </div>
    </DndContext>
  )
}

export default KanbanBoard
