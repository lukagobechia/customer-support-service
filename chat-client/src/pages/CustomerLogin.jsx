"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import ApiService from "../lib/api-service"

export default function CustomerLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = await ApiService.login(email, password)
      if (ApiService.getRole() !== "customer") {
        setError("Invalid credentials for customer login")
        return
      }
      navigate("/customer/dashboard")
    } catch (err) {
      setError(err.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">Customer Support Portal</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-md mx-auto p-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Customer Login</h2>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="form-input"
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="form-input"
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && <p className="form-error">{error}</p>}

                <button className="button button-default w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
            <div className="card-footer justify-center">
              <Link to="/" className="text-sm text-blue-600 hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

