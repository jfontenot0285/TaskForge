import { Button, Form, Input, Modal, Select } from 'antd'
import { useEffect } from 'react'

export const STORY_TEMPLATE = `As a ...
I want to ...
So that ...`

function TaskModal({ open, task, submitting, onCancel, onSave, onDelete }) {
  const [form] = Form.useForm()
  const editing = Boolean(task)

  useEffect(() => {
    if (!open) {
      return
    }
    form.setFieldsValue({
      title: task?.title || '',
      priority: task?.priority || 'medium',
      description: task?.description || STORY_TEMPLATE,
    })
  }, [open, task, form])

  return (
    <Modal
      title={editing ? 'Edit task' : 'Create task'}
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      centered
      footer={
        <div className="task-modal__footer">
          {editing ? (
            <Button danger onClick={onDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="task-modal__actions">
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              Save
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={onSave}>
        <Form.Item
          label="Task name"
          name="title"
          rules={[{ required: true, message: 'Enter a task name' }]}
        >
          <Input size="large" placeholder="Task name" />
        </Form.Item>
        <Form.Item label="Priority" name="priority">
          <Select
            size="large"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Details"
          name="description"
        >
          <Input.TextArea rows={6} placeholder={STORY_TEMPLATE} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TaskModal
