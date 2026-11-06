import { primeCsrf, request } from './client'

export { primeCsrf }

export function fetchMe() {
  return request('/api/auth/me/')
}

export function login(username, password) {
  return request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function register(username, password) {
  return request('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout() {
  return request('/api/auth/logout/', { method: 'POST' })
}
