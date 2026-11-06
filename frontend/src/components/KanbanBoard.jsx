import { EditOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useDraggable, useDroppable, DndContext, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'

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

const PAGE_SLOT = 32

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function pageItems(current, total, maxSlots) {
  if (maxSlots >= total) {
    return range(1, total)
  }
  if (maxSlots <= 1) {
    return [current]
  }
  if (maxSlots === 2) {
    return current === 1 ? [1, total] : [current, total]
  }

  const windowSize = maxSlots - 2
  if (current <= windowSize) {
    return [...range(1, windowSize), 'ellipsis', total]
  }

  const endStart = total - windowSize + 1
  if (current >= endStart) {
    return [1, 'ellipsis', ...range(endStart, total)]
  }

  const middleSize = Math.max(1, maxSlots - 4)
  let start = current - Math.floor((middleSize - 1) / 2)
  let end = start + middleSize - 1
  if (start < 2) {
    start = 2
    end = start + middleSize - 1
  }
  if (end > total - 1) {
    end = total - 1
    start = end - middleSize + 1
  }
  return [1, 'ellipsis-start', ...range(start, end), 'ellipsis-end', total]
}

function usePageSlots() {
  const ref = useRef(null)
  const [slots, setSlots] = useState(Number.POSITIVE_INFINITY)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return undefined
    }

    function measure() {
      const width = node.clientWidth
      setSlots(Math.max(1, Math.floor((width + 4) / PAGE_SLOT)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, slots }
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

function Column({ column, tasks, count, page, stacked, onOpen, onMove, onPageChange }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled: stacked })
  const { ref: pagesRef, slots } = usePageSlots()
  const pageCount = Math.max(1, Math.ceil(count / 10))
  const visiblePages = pageItems(page, pageCount, slots)

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column--over' : ''}`}
    >
      <header>
        <h2>{column.title}</h2>
        <span>{count}</span>
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
      {count > 10 ? (
        <nav className="kanban-column__pager" aria-label={`${column.title} pages`}>
          <button
            type="button"
            className="kanban-column__page"
            aria-label={`Previous ${column.title} page`}
            disabled={page <= 1}
            onClick={() => onPageChange(column.id, page - 1)}
          >
            <LeftOutlined />
          </button>
          <ol className="kanban-column__pages" ref={pagesRef}>
            {visiblePages.map((item) => (
              <li key={item}>
                {String(item).startsWith('ellipsis') ? (
                  <span className="kanban-column__ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`kanban-column__page-number${item === page ? ' kanban-column__page-number--current' : ''}`}
                    aria-label={`${column.title} page ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                    onClick={() => onPageChange(column.id, item)}
                  >
                    {item}
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="kanban-column__page"
            aria-label={`Next ${column.title} page`}
            disabled={page >= pageCount}
            onClick={() => onPageChange(column.id, page + 1)}
          >
            <RightOutlined />
          </button>
        </nav>
      ) : null}
    </section>
  )
}

function KanbanBoard({ columns, onOpenTask, onMoveTask, onPageChange }) {
  const stacked = useStackedBoard()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )
  const tasks = COLUMNS.flatMap((column) => columns[column.id]?.results || [])

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
          tasks={columns[column.id]?.results || []}
          count={columns[column.id]?.count || 0}
          page={columns[column.id]?.page || 1}
          onOpen={onOpenTask}
          onMove={onMoveTask}
          onPageChange={onPageChange}
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

export function KanbanSkeleton() {
  const stacked = useStackedBoard()

  return (
    <div
      className={`kanban${stacked ? ' kanban--stacked' : ''}`}
      aria-busy="true"
      aria-label="Loading tasks"
    >
      {COLUMNS.map((column) => (
        <section key={column.id} className="kanban-column kanban-column--pulse">
          <header>
            <h2>{column.title}</h2>
          </header>
        </section>
      ))}
    </div>
  )
}

export default KanbanBoard
