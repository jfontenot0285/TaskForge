import { EditOutlined, PlusOutlined, ThunderboltFilled } from '@ant-design/icons'
import { Button } from 'antd'

function BoardWalkthrough() {
  return (
    <section className="walkthrough" aria-label="Demo: create a task and move it to completion">
      <div className="walkthrough__stage" aria-hidden="true">
        <header className="walkthrough__top">
          <div className="brand">
            <span className="brand__mark">
              <ThunderboltFilled />
            </span>
            <span className="brand__name">TaskForge</span>
          </div>
          <div className="dashboard__actions">
            <Button type="primary" size="small" icon={<PlusOutlined />} className="walkthrough__create">
              Create task
            </Button>
            <Button size="small">Log out</Button>
          </div>
        </header>

        <div className="walkthrough__board">
          <section className="kanban-column">
            <header>
              <h2>New</h2>
              <span>1</span>
            </header>
          </section>
          <section className="kanban-column">
            <header>
              <h2>In progress</h2>
              <span>1</span>
            </header>
          </section>
          <section className="kanban-column">
            <header>
              <h2>Done</h2>
              <span>1</span>
            </header>
          </section>

          <article className="task-card walkthrough__card">
            <div className="task-card__top">
              <h3>Log in</h3>
              <span className="task-card__priority-meta">
                <span className="task-card__priority-label">Priority</span>
                <span className="task-card__priority task-card__priority--high">high</span>
              </span>
            </div>
            <p>
              As a returning teammate
              {'\n'}I want to log in
              {'\n'}So that I can open my task board
            </p>
            <div className="task-card__footer">
              <span className="task-card__edit">
                <EditOutlined />
              </span>
            </div>
          </article>
        </div>

        <div className="walkthrough__modal">
          <h4>Create task</h4>
          <label>
            Task name
            <span className="walkthrough__field">
              <span className="walkthrough__typed">Log in</span>
            </span>
          </label>
          <div className="walkthrough__modal-actions">
            <span>Cancel</span>
            <span className="walkthrough__save">Save</span>
          </div>
        </div>

        <div className="walkthrough__cursor">
          <svg className="walkthrough__cursor-pointer" viewBox="0 0 24 24">
            <path
              fill="#e8f3ff"
              stroke="#06101c"
              strokeWidth="1.2"
              d="M4.2 2.8 5.4 19.2l4.3-3.7 2.9 6.8 3.4-1.5-2.9-6.7 6.6-1.4z"
            />
          </svg>
          <svg className="walkthrough__cursor-hand" viewBox="0 0 24 24" fill="none">
            <path
              fill="#e8f3ff"
              stroke="#06101c"
              strokeWidth="1.2"
              strokeLinejoin="round"
              d="M8 13.2V6.8a1.4 1.4 0 0 1 2.8 0v5.1h.2V5.7a1.4 1.4 0 0 1 2.8 0v6.2h.2V6.9a1.4 1.4 0 0 1 2.8 0V14a5.2 5.2 0 0 1-5.2 5.2h-.6A5.2 5.2 0 0 1 6 14v-2.3a1.4 1.4 0 0 1 2 0Z"
            />
          </svg>
          <svg className="walkthrough__cursor-grip" viewBox="0 0 24 24" fill="none">
            <path
              fill="#e8f3ff"
              stroke="#06101c"
              strokeWidth="1.2"
              strokeLinejoin="round"
              d="M7.5 11.2h9.2A1.8 1.8 0 0 1 18.5 13v1.1a5.6 5.6 0 0 1-5.6 5.6h-1.4A5.6 5.6 0 0 1 5.9 14.1V13a1.8 1.8 0 0 1 1.6-1.8Z"
            />
            <path
              fill="#e8f3ff"
              stroke="#06101c"
              strokeWidth="1.2"
              d="M8.2 11.2V8.4a1.3 1.3 0 0 1 2.6 0v2.8"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

export default BoardWalkthrough
