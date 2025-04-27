"use client";

import { formatDistanceToNow } from "date-fns";

export default function TicketList({
  tickets,
  userType,
  onSelectTicket,
  isLoading,
  currentPage,
  onPageChange,
  totalPages,
}) {
  const getStatusClass = (status) => {
    switch (status) {
      case "open":
        return "badge-status-open";
      case "in-progress":
        return "badge-status-in-progress";
      case "closed":
        return "badge-status-closed";
      default:
        return "badge-status-closed";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "badge-priority-high";
      case "medium":
        return "badge-priority-medium";
      case "low":
        return "badge-priority-low";
      default:
        return "badge-priority-medium";
    }
  };

  return (
    <div className="ticket-list-container">
      <div className="ticket-list">
        {isLoading ? (
          <div className="card">
            <div className="card-content ticket-empty">
              <p>Loading tickets...</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="card">
            <div className="card-content ticket-empty">
              <p>No tickets found</p>
            </div>
          </div>
        ) : (
          Array.isArray(tickets) &&
          tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="card ticket-item card-clickable"
              onClick={() => onSelectTicket(ticket._id)}
            >
              <div className="ticket-header">
                <div className="ticket-title-row">
                  <h3 className="ticket-title">{ticket.title}</h3>
                  <div className="ticket-badges">
                    <span
                      className={`badge ${getPriorityClass(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                    <span className={`badge ${getStatusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <div className="ticket-meta">
                  {userType === "agent" ? (
                    <span>
                      From:{" "}
                      {ticket.customer?.firstName +
                        " " +
                        ticket.customer?.lastName ||
                        ticket.customer?.name ||
                        "Unknown"}
                    </span>
                  ) : ticket.assignee ? (
                    <span>
                      Assigned to:{" "}
                      {ticket.assignee.firstName +
                        " " +
                        ticket.assignee.lastName ||
                        ticket.assignee.name ||
                        "Unknown"}
                    </span>
                  ) : (
                    <span>Unassigned</span>
                  )}
                </div>
              </div>
              <div className="ticket-content">
                <p className="ticket-description">
                  {ticket.issue || ticket.description}
                </p>
                <div className="ticket-footer">
                  <span>
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>
                    {ticket.messages?.length || 0}{" "}
                    {ticket.messages?.length === 1 ? "message" : "messages"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {!isLoading && tickets.length > 0 && (
        <div className="pagination">
          <button
            className="button button-outline button-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            className="button button-outline button-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!totalPages || currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
