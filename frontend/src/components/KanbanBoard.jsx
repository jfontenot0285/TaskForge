import { EditOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useDraggable, useDroppable, DndContext, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { useEffect, useState } from 'react'

export const COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'done', title: 'Done' },
]

function useStackedBoard() {
  const [stacked, setStacked] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)')
    function onChange(event) {
      setStacked(event.matches)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return stacked
}

function TaskCard({ task, stacked, onOpen, onMove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: stacked,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  const index = COLUMNS.findIndex((column) => column.id === task.status)
  const previous = COLUMNS[index - 1]
  const next = COLUMNS[index + 1]
  const dragProps = stacked ? {} : { ...listeners, ...attributes }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'task-card--dragging' : ''} ${stacked ? 'task-card--stacked' : ''}`}
      {...dragProps}
    >
      <div className="task-card__top">
        <h3>{task.title}</h3>
        <span className="task-card__priority-meta">
          <span className="task-card__priority-label">Priority</span>
          <span className={`task-card__priority task-card__priority--${task.priority}`}>
            {task.priority}
          </span>
        </span>
      </div>
      {task.description ? <p>{task.description}</p> : null}
      <div className="task-card__footer">
        {stacked ? (
          <div className="task-card__stepper">
            <button
              type="button"
              className="task-card__step"
              aria-label="Move to previous status"
              disabled={!previous}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                if (previous) {
                  onMove(task.id, previous.id)
                }
              }}
            >
              <LeftOutlined />
            </button>
            <button
              type="button"
              className="task-card__step"
              aria-label="Move to next status"
              disabled={!next}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                if (next) {
                  onMove(task.id, next.id)
                }
              }}
            >
              <RightOutlined />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="task-card__edit"
          aria-label={`Edit ${task.title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onOpen(task)
          }}
        >
          <EditOutlined />
        </button>
      </div>
    </article>
  )
}

function Column({ column, tasks, stacked, onOpen, onMove }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: stacked })

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
          <TaskCard
            key={task.id}
            task={task}
            stacked={stacked}
            onOpen={onOpen}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  )
}

function KanbanBoard({ tasks, onOpenTask, onMoveTask }) {
  const stacked = useStackedBoard()
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

  const board = (
    <div className={`kanban${stacked ? ' kanban--stacked' : ''}`}>
      {COLUMNS.map((column) => (
        <Column
          key={column.id}
          column={column}
          stacked={stacked}
          tasks={tasks.filter((task) => task.status === column.id)}
          onOpen={onOpenTask}
          onMove={onMoveTask}
        />
      ))}
    </div>
  )

  if (stacked) {
    return board
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      {board}
    </DndContext>
  )
}

export default KanbanBoard
