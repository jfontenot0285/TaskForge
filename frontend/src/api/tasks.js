import { request } from './client'

export function listTasks() {
  return request('/api/tasks/')
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
