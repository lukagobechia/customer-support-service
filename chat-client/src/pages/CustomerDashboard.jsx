"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TicketList from "../components/ticket-list"
import ChatInterface from "../components/chat-interface"
import CreateTicketForm from "../components/create-ticket-form"
import ApiService from "../lib/api-service"

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await ApiService.getCurrentUser()
        if (!user || user.role !== "customer") {
          navigate("/customer")
          return
        }
        setCurrentUser(user)
        fetchTickets()
      } catch (error) {
        console.error("Auth check failed:", error)
        navigate("/customer")
      }
    }

    checkAuth()
  }, [navigate])

  // Fetch tickets when filters or pagination changes
  useEffect(() => {
    if (currentUser) {
      fetchTickets()
    }
  }, [currentPage, pageSize, statusFilter, searchTerm])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      // Build query parameters
      const queryParams = {
        page: currentPage,
        take: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
      }

      // Add filters if they exist
      if (searchTerm) queryParams.search = searchTerm
      if (statusFilter) queryParams.status = statusFilter

      const { data, meta } = await ApiService.getCustomerTickets(queryParams)
      setTickets(data)
      setTotalPages(meta.totalPages)
      
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
      setIsCreatingTicket(false)
    } catch (error) {
      console.error("Error fetching ticket details:", error)
    }
  }

  const handleTicketCreated = (newTicket) => {
    // Refresh the ticket list to include the new ticket
    fetchTickets()
    setSelectedTicket(newTicket)
    setIsCreatingTicket(false)
  }

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket)
    // Refresh the ticket list to reflect the update
    fetchTickets()
  }

  const handleLogout = async () => {
    await ApiService.logout()
    navigate("/customer")
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Reset to first page when searching
    setCurrentPage(1)
    // The actual search is handled by the useEffect that watches searchTerm
  }

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status === statusFilter ? "" : status)
    setCurrentPage(1)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">Customer Support Portal</h1>
          <div className="header-actions">
            {currentUser && (
              <span className="user-welcome">Welcome, {currentUser.firstName + " " + currentUser.lastName}</span>
            )}
            <button className="button button-outline button-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        <div className="sidebar">
          <div className="flex justify-between items-center">
            <h2>Your Tickets</h2>
            <button
              className="button button-default"
              onClick={() => {
                setIsCreatingTicket(true)
                setSelectedTicket(null)
              }}
            >
              New Ticket
            </button>
          </div>

          <div className="filter-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <input
                  className="form-input"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>

            <div className="status-filters">
              <div className="filter-label">Filter by status:</div>
              <div className="flex space-x">
                <button
                  className={`button ${statusFilter === "open" ? "button-default" : "button-outline"} button-sm`}
                  onClick={() => handleStatusFilterChange("open")}
                >
                  Open
                </button>
                <button
                  className={`button ${statusFilter === "in-progress" ? "button-default" : "button-outline"} button-sm`}
                  onClick={() => handleStatusFilterChange("in-progress")}
                >
                  In Progress
                </button>
                <button
                  className={`button ${statusFilter === "closed" ? "button-default" : "button-outline"} button-sm`}
                  onClick={() => handleStatusFilterChange("closed")}
                >
                  Closed
                </button>
              </div>
            </div>
          </div>

          <TicketList
            tickets={tickets}
            userType="customer"
            onSelectTicket={handleSelectTicket}
            isLoading={isLoading}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>

        <div className="content-area">
          {isCreatingTicket ? (
            <CreateTicketForm onTicketCreated={handleTicketCreated} onCancel={() => setIsCreatingTicket(false)} />
          ) : (
            <ChatInterface ticket={selectedTicket} userType="customer" onTicketUpdated={handleTicketUpdated} />
          )}
        </div>
      </main>
    </div>
  )
}

