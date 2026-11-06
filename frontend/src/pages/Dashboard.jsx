import { PlusOutlined, ThunderboltFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import KanbanBoard, { COLUMNS, KanbanSkeleton } from '../components/KanbanBoard'
import TaskModal from '../components/TaskModal'
import { useAuth } from '../context/AuthContext'
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks'

function emptyColumn(page = 1) {
  return { results: [], count: 0, page, sort: 'created_at', order: 'desc' }
}

function emptyBoard() {
  return {
    new: emptyColumn(),
    in_progress: emptyColumn(),
    done: emptyColumn(),
  }
}

function Dashboard() {
  const { user, logout } = useAuth()
  const [columns, setColumns] = useState(emptyBoard)
  const columnsRef = useRef(columns)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  columnsRef.current = columns

  const loadColumn = useCallback(async (status, page = 1, options = {}) => {
    const current = columnsRef.current[status] || {}
    const sort = options.sort ?? current.sort ?? 'created_at'
    const order = options.order ?? current.order ?? 'desc'
    try {
      const data = await listTasks({ status, page, sort, order })
      setColumns((board) => ({
        ...board,
        [status]: {
          results: data.results,
          count: data.count,
          page,
          sort,
          order,
        },
      }))
    } catch {
      if (page > 1) {
        await loadColumn(status, page - 1, { sort, order })
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadBoard() {
      try {
        await Promise.all(COLUMNS.map((column) => loadColumn(column.id, 1)))
      } catch {
        if (!cancelled) {
          setColumns(emptyBoard())
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBoard()
    return () => {
      cancelled = true
    }
  }, [loadColumn])

  function openCreate() {
    setActiveTask(null)
    setModalOpen(true)
  }

  function openTask(task) {
    setActiveTask(task)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setActiveTask(null)
  }

  async function handleSave(values) {
    setSubmitting(true)
    try {
      if (activeTask) {
        const previousStatus = activeTask.status
        await updateTask(activeTask.id, values)
        const nextStatus = values.status || previousStatus
        await loadColumn(previousStatus, columns[previousStatus].page)
        if (nextStatus !== previousStatus) {
          await loadColumn(nextStatus, columns[nextStatus].page)
        }
      } else {
        await createTask({
          ...values,
          status: 'new',
        })
        await loadColumn('new', 1)
      }
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!activeTask) {
      return
    }
    setSubmitting(true)
    try {
      const status = activeTask.status
      await deleteTask(activeTask.id)
      await loadColumn(status, columns[status].page)
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMoveTask(id, status) {
    const currentTask = COLUMNS.flatMap((column) => columns[column.id].results).find(
      (task) => task.id === id,
    )
    if (!currentTask || currentTask.status === status) {
      return
    }
    const fromStatus = currentTask.status
    try {
      await updateTask(id, { status })
      await Promise.all([
        loadColumn(fromStatus, columns[fromStatus].page),
        loadColumn(status, columns[status].page),
      ])
    } catch {
      await Promise.all([
        loadColumn(fromStatus, columns[fromStatus].page),
        loadColumn(status, columns[status].page),
      ])
    }
  }

  function handleSortChange(status, next) {
    const current = columnsRef.current[status] || {}
    loadColumn(status, 1, {
      sort: next.sort ?? current.sort,
      order: next.order ?? current.order,
    })
  }

  return (
    <div className="dashboard">
      <div className="landing__aurora" aria-hidden="true" />
      <div className="landing__grid" aria-hidden="true" />

      <header className="dashboard__top">
        <Link to="/" className="brand" aria-label="TaskForge home">
          <span className="brand__mark">
            <ThunderboltFilled />
          </span>
          <span className="brand__name">TaskForge</span>
        </Link>
        <div className="dashboard__actions">
          <span className="dashboard__user">{user?.username}</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create task
          </Button>
          <Button onClick={logout}>Log out</Button>
        </div>
      </header>

      <main className="dashboard__board">
        {loading ? (
          <KanbanSkeleton />
        ) : (
          <KanbanBoard
            columns={columns}
            onOpenTask={openTask}
            onMoveTask={handleMoveTask}
            onPageChange={loadColumn}
            onSortChange={handleSortChange}
          />
        )}
      </main>

      <TaskModal
        open={modalOpen}
        task={activeTask}
        submitting={submitting}
        onCancel={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default Dashboard
