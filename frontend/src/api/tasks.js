import { request } from './client'

export function listTasks({ status, page = 1 } = {}) {
  const params = new URLSearchParams({ page: String(page) })
  if (status) {
    params.set('status', status)
  }
  return request(`/api/tasks/?${params}`)
}

export function createTask(payload) {
  return request('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTask(id, payload) {
  return request(`/api/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}/`, { method: 'DELETE' })
}
