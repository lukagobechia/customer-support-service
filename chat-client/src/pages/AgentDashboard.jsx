"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TicketList from "../components/ticket-list"
import ChatInterface from "../components/chat-interface"
import ApiService from "../lib/api-service"
import { io } from "socket.io-client"

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [socket, setSocket] = useState(null)
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [priorityFilter, setPriorityFilter] = useState("")
  const [assigneeFilter, setAssigneeFilter] = useState("")
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" })

  useEffect(() => {
    const socketInstance = io("http://localhost:3000") 
    setSocket(socketInstance)

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await ApiService.getCurrentUser()
        if (!user || user.role !== "agent") {
          navigate("/agent")
          return
        }
        setCurrentUser(user)
        fetchTickets()
      } catch (error) {
        console.error("Auth check failed:", error)
        navigate("/agent")
      }
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    if (currentUser) {
      fetchTickets()
    }
  }, [currentPage, pageSize, searchTerm, statusFilter, priorityFilter, assigneeFilter, dateRange])

  useEffect(() => {
    if (!socket) return

    socket.on("list-updated", (update) => {
      fetchTickets()
    })

    return () => {
      socket.off("list-updated") 
    }
  }, [socket])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const queryParams = {
        page: currentPage,
        take: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      }

      if (searchTerm) queryParams.search = searchTerm
      if (statusFilter && statusFilter !== "all") queryParams.status = statusFilter
      if (priorityFilter) queryParams.priority = priorityFilter
      if (assigneeFilter) queryParams.assignee = assigneeFilter
      if (dateRange.startDate && dateRange.endDate) {
        queryParams.startDate = dateRange.startDate
        queryParams.endDate = dateRange.endDate
      }

      const allTickets = await ApiService.getAllTickets(queryParams)
      setTickets(allTickets)


      setTotalPages(Math.ceil(allTickets.length / pageSize) || 1)
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTicket = async (ticketId) => {
    try {
      const ticket = await ApiService.getTicketById(ticketId)
      setSelectedTicket(ticket)
    } catch (error) {
      console.error("Error fetching ticket details:", error)
    }
  }

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket)
    fetchTickets()
  }

  const handleLogout = async () => {
    await ApiService.logout()
    navigate("/agent")
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("")
    setAssigneeFilter("")
    setDateRange({ startDate: "", endDate: "" })
    setCurrentPage(1)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">Agent Support Portal</h1>
          <div className="header-actions">
            {currentUser && (
              <span className="user-welcome">Agent: {currentUser.firstName + " " + currentUser.lastName}</span>
            )}
            <button className="button button-outline button-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        <div className="sidebar">
          <div className="space-y">
            <h2>Support Tickets</h2>

            <form onSubmit={handleSearch} className="filter-form">
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-section">
                <div className="filter-label">Status:</div>
                <div className="flex space-x">
                  <button
                    type="button"
                    className={`button ${statusFilter === "all" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`button ${statusFilter === "open" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setStatusFilter("open")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={`button ${statusFilter === "in-progress" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setStatusFilter("in-progress")}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    className={`button ${statusFilter === "closed" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setStatusFilter("closed")}
                  >
                    Closed
                  </button>
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Priority:</div>
                <div className="flex space-x">
                  <button
                    type="button"
                    className={`button ${priorityFilter === "" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setPriorityFilter("")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`button ${priorityFilter === "low" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setPriorityFilter("low")}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    className={`button ${priorityFilter === "medium" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setPriorityFilter("medium")}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    className={`button ${priorityFilter === "high" ? "button-default" : "button-outline"} button-sm`}
                    onClick={() => setPriorityFilter("high")}
                  >
                    High
                  </button>
                </div>
              </div>

              <div className="filter-section">
                <div className="filter-label">Date Range:</div>
                <div className="date-range-inputs">
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    className="form-input"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="filter-actions">
                <button type="submit" className="button button-default button-sm">
                  Apply Filters
                </button>
                <button type="button" className="button button-outline button-sm" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            </form>
          </div>

          <TicketList
            tickets={tickets}
            userType="agent"
            onSelectTicket={handleSelectTicket}
            isLoading={isLoading}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>

        <div className="content-area">
          <ChatInterface ticket={selectedTicket} userType="agent" onTicketUpdated={handleTicketUpdated} />
        </div>
      </main>
    </div>
  )
}

