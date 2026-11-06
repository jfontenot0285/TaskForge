import { PlusOutlined, ThunderboltFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import KanbanBoard from '../components/KanbanBoard'
import TaskModal from '../components/TaskModal'
import { useAuth } from '../context/AuthContext'
import { createTask, deleteTask, listTasks, updateTask } from '../api/tasks'

function Dashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      try {
        const data = await listTasks()
        if (!cancelled) {
          setTasks(data)
        }
      } catch {
        if (!cancelled) {
          setTasks([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTasks()
    return () => {
      cancelled = true
    }
  }, [])

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
        const updated = await updateTask(activeTask.id, values)
        setTasks((current) =>
          current.map((task) => (task.id === updated.id ? updated : task)),
        )
      } else {
        const created = await createTask({
          ...values,
          status: 'new',
        })
        setTasks((current) => [created, ...current])
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
      await deleteTask(activeTask.id)
      setTasks((current) => current.filter((task) => task.id !== activeTask.id))
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMoveTask(id, status) {
    const previous = tasks
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status } : task)),
    )
    try {
      const updated = await updateTask(id, { status })
      setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      )
    } catch {
      setTasks(previous)
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
          <KanbanBoard tasks={tasks} onOpenTask={openTask} onMoveTask={handleMoveTask} />
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
