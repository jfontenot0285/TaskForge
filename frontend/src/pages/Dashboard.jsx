import { PlusOutlined, ThunderboltFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import KanbanBoard, { COLUMNS } from '../components/KanbanBoard'
import TaskModal from '../components/TaskModal'
import { useAuth } from '../context/AuthContext'
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks'

function emptyColumn(page = 1) {
  return { results: [], count: 0, page }
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
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadColumn = useCallback(async (status, page = 1) => {
    try {
      const data = await listTasks({ status, page })
      setColumns((current) => ({
        ...current,
        [status]: {
          results: data.results,
          count: data.count,
          page,
        },
      }))
    } catch {
      if (page > 1) {
        await loadColumn(status, page - 1)
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
          <p className="dashboard__loading">Loading tasks...</p>
        ) : (
          <KanbanBoard
            columns={columns}
            onOpenTask={openTask}
            onMoveTask={handleMoveTask}
            onPageChange={loadColumn}
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
