"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ApiService from "../lib/api-service"
import "./ui/card.css"
import "./ui/button.css"
import "./ui/form.css"

export default function AuthForm({ userType }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await ApiService.login(email, password)

      if (userType === "customer" && ApiService.getRole() !== "customer") {
        setError("You do not have customer access")
        setIsLoading(false)
        return
      }

      if (userType === "agent" && ApiService.getRole()!== "agent") {
        setError("You do not have agent access")
        setIsLoading(false)
        return
      }

      navigate(`/${userType}/dashboard`)
    } catch (err) {
      setError(err.message || "Failed to login")
      setIsLoading(false)
    }
  }

  return (
    <div className="card" style={{ width: "100%", maxWidth: "28rem" }}>
      <div className="card-header">
        <h2 className="card-title">{userType === "customer" ? "Customer Login" : "Agent Login"}</h2>
        <p className="card-description">Enter your credentials to access the {userType} portal</p>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="space-y">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button button-default button-block" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}

