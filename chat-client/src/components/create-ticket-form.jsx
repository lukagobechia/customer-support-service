"use client"

import { useState } from "react"
import ApiService from "../lib/api-service"

export default function CreateTicketForm({ onTicketCreated, onCancel }) {
  const [title, setTitle] = useState("")
  const [issue, setIssue] = useState("")
  const [priority, setPriority] = useState("medium")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const newTicket = await ApiService.createTicket({
        title,
        issue,
        priority,
      })

      onTicketCreated(newTicket)
    } catch (err) {
      setError(err.message || "Failed to create ticket")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Create New Support Ticket</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit} className="space-y">
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Title
            </label>
            <input
              className="form-input"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of your issue"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="issue">
              Issue
            </label>
            <textarea
              className="form-textarea"
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Please provide details about your issue"
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="priority">
              Priority
            </label>
            <div className="form-select-wrapper">
              <select
                className="form-select"
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
      <div className="card-footer">
        <button className="button button-outline" onClick={onCancel}>
          Cancel
        </button>
        <button className="button button-default" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </div>
  )
}

