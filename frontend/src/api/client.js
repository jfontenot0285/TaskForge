function csrfToken() {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = csrfToken()
  if (token) {
    headers['X-CSRFToken'] = token
  }

  let response
  try {
    response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers,
    })
  } catch {
    throw new Error('Cannot reach the API. Start Django with manage.py runserver.')
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      data.non_field_errors?.[0] ||
      data.detail ||
      Object.values(data)[0]?.[0] ||
      (response.status >= 500
        ? 'Cannot reach the API. Start Django with manage.py runserver.'
        : 'Request failed')
    throw new Error(message)
  }
  return data
}

export function primeCsrf() {
  return request('/api/auth/csrf/', { method: 'GET', headers: {} })
}
