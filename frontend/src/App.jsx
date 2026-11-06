import { ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import themeConfig from './theme'
import './App.css'

function GuestRoute({ children }) {
  const { user, checkingSession } = useAuth()
  if (checkingSession) {
    return <div className="boot-screen" />
  }
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function ProtectedRoute({ children }) {
  const { user, checkingSession } = useAuth()
  if (checkingSession) {
    return <div className="boot-screen" />
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestRoute>
            <Landing />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
