import { LockOutlined, ThunderboltFilled, UserOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal } from 'antd'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const passwordRules = [
  { required: true, message: 'Enter a password' },
  { min: 8, message: 'Password must be at least 8 characters' },
  {
    pattern: /\d/,
    message: 'Password must contain at least one number',
  },
]

function Landing() {
  const { login, register } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  async function handleLogin(values) {
    setSubmitting(true)
    try {
      await login(values.username, values.password)
      setLoginOpen(false)
      loginForm.resetFields()
    } catch (error) {
      loginForm.setFields([
        {
          name: 'password',
          errors: [error.message],
        },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(values) {
    setSubmitting(true)
    try {
      await register(values.username, values.password)
      setRegisterOpen(false)
      registerForm.resetFields()
    } catch (error) {
      registerForm.setFields([
        {
          name: 'password',
          errors: [error.message],
        },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing__aurora" aria-hidden="true" />
      <div className="landing__grid" aria-hidden="true" />
      <div className="landing__scan" aria-hidden="true" />

      <header className="landing__top">
        <div className="brand">
          <span className="brand__mark">
            <ThunderboltFilled />
          </span>
          <span className="brand__name">TaskForge</span>
        </div>
        <div className="landing__actions">
          <Button onClick={() => setRegisterOpen(true)}>Register</Button>
          <Button type="primary" onClick={() => setLoginOpen(true)}>
            Log in
          </Button>
        </div>
      </header>

      <main className="hero">
        <div className="hero__frame">
          <p className="hero__kicker">Operations console</p>
          <h1 className="hero__title">
            Welcome to
            <span>TaskForge</span>
          </h1>
          <p className="hero__lede">
            A blue-lit workspace for forging projects, assigning work, and
            driving tasks to done.
          </p>
          <div className="hero__actions">
            <Button size="large" onClick={() => setRegisterOpen(true)}>
              Register
            </Button>
            <Button type="primary" size="large" onClick={() => setLoginOpen(true)}>
              Log in
            </Button>
          </div>
        </div>
      </main>

      <Modal
        title="Log in to TaskForge"
        open={loginOpen}
        onCancel={() => setLoginOpen(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <Form form={loginForm} layout="vertical" requiredMark={false} onFinish={handleLogin}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Enter your username' }]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              autoComplete="username"
              placeholder="Username"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              autoComplete="current-password"
              placeholder="Password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            Log in
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Create a TaskForge account"
        open={registerOpen}
        onCancel={() => setRegisterOpen(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <Form
          form={registerForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleRegister}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Enter a username' }]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              autoComplete="username"
              placeholder="Username"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            extra="At least 8 characters and 1 number"
            rules={passwordRules}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              autoComplete="new-password"
              placeholder="Password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
            Register
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

export default Landing
