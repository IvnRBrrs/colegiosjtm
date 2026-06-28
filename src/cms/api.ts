import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cms_token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Content helpers
export async function fetchContent(): Promise<Record<string, string>> {
  const { data } = await api.get('/content')
  return data
}

export async function updateContent(key: string, value: string) {
  await api.put('/content', { key, value })
}

export async function bulkUpdateContent(entries: Record<string, string>) {
  await api.put('/content/bulk', { entries })
}

// Pages
export async function fetchPages() {
  const { data } = await api.get('/pages')
  return data
}

export async function fetchPageContent(slug: string): Promise<Record<string, string>> {
  const { data } = await api.get(`/pages/${slug}/content`)
  return data
}

export async function updatePageContent(slug: string, entries: Record<string, string>) {
  await api.put(`/pages/${slug}/content/bulk`, { entries })
}

// Images
export async function uploadImage(filename: string, data: string, type: string, component_type?: string) {
  const { data: result } = await api.post('/images/upload', { filename, data, type, component_type })
  return result
}

export async function fetchImages() {
  const { data } = await api.get('/images')
  return data
}

// Messages
export async function submitContactMessage(msg: { name: string; email: string; phone?: string; message: string }) {
  await api.post('/messages', msg)
}

export async function fetchMessages() {
  const { data } = await api.get('/messages')
  return data
}

// Blog
export async function fetchBlogPosts(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, String(v)) })
  const { data } = await api.get(`/blog/posts?${query}`)
  return data
}

export async function fetchBlogPost(id: string) {
  const { data } = await api.get(`/blog/posts/${id}`)
  return data
}

export async function createBlogPost(post: Record<string, any>) {
  const { data } = await api.post('/blog/posts', post)
  return data
}

export async function updateBlogPost(id: string, post: Record<string, any>) {
  const { data } = await api.put(`/blog/posts/${id}`, post)
  return data
}

export async function deleteBlogPost(id: string) {
  const { data } = await api.delete(`/blog/posts/${id}`)
  return data
}

export async function fetchBlogTags() {
  const { data } = await api.get('/blog/tags')
  return data
}

export async function fetchBlogAuthors() {
  const { data } = await api.get('/blog/authors')
  return data
}

export async function fetchBlogArchive() {
  const { data } = await api.get('/blog/archive')
  return data
}

// Auth
export async function login(username: string, password: string): Promise<string> {
  const { data } = await api.post('/auth/login', { username, password })
  return data.token
}

// Backups
export async function createBackup(section_key: string, value: Record<string, string>) {
  const { data } = await api.post('/backups', { section_key, value: JSON.stringify(value) })
  return data
}

export async function fetchBackups(section_key: string) {
  const { data } = await api.get(`/backups/${section_key}`)
  return data
}
