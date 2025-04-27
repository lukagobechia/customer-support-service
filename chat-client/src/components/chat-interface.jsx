import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { io } from "socket.io-client";
import ApiService from "../lib/api-service";
import ChatImage from "./Chat-image";

export default function ChatInterface({ ticket, userType, onTicketUpdated }) {
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [readMessages, setReadMessages] = useState({});
  const [seenMessages, setSeenMessages] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  // const [imageModalOpen, setImageModalOpen] = useState(false);
  // const [modalImage, setModalImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3000'); // Replace with your backend URL
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle receiving messages
    socket.on("receiveMessage", (updatedTicket) => {
      onTicketUpdated(updatedTicket);
    });

    // Handle typing indicators
    socket.on("userTyping", ({ user }) => {
      if (currentUser && user !== currentUser.firstName) {
        setIsTyping(true);
        setTypingUser(user);
      }
    });

    socket.on("userStoppedTyping", ({ user }) => {
      if (currentUser && user !== currentUser.firstName) {
        setIsTyping(false);
        setTypingUser("");
      }
    });

    // Handle message read receipts
    socket.on("messageRead", ({ messageId, user }) => {
      if (currentUser && user !== currentUser.firstName) {
        setReadMessages((prev) => ({
          ...prev,
          [messageId]: true,
        }));
      }
    });

    // Handle message seen receipts
    socket.on("messageSeen", ({ messageId, user }) => {
      if (currentUser && user !== currentUser.firstName) {
        setSeenMessages((prev) => ({
          ...prev,
          [messageId]: true,
        }));
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Clean up on unmount
    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messageRead");
      socket.off("messageSeen");
      socket.off("error");
    };
  }, [socket, currentUser, onTicketUpdated]);

  // Join ticket room when ticket changes
  useEffect(() => {
    if (ticket && socket) {
      // Leave previous ticket room if any
      socket.emit("leaveTicket", ticket._id);

      // Join new ticket room
      socket.emit("joinTicket", ticket._id);

      // Emit user online status
      if (currentUser) {
        socket.emit("userOnline", currentUser.firstName);
      }
    }

    return () => {
      if (ticket && socket) {
        socket.emit("leaveTicket", ticket._id);
      }
    };
  }, [ticket, currentUser, socket]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await ApiService.getCurrentUser();
        setCurrentUser(user);

        // Emit user online status
        if (user && socket) {
          socket.emit("userOnline", user.firstName);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    const fetchAgents = async () => {
      try {
        // In a real app, you would fetch this from the API
        const agents = await ApiService.fetchAgents();
        setAgents(agents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    fetchCurrentUser();
    if (userType === "agent") {
      fetchAgents();
    }

    // Clean up - emit user offline
    return () => {
      if (currentUser && socket) {
        socket.emit("userOffline", currentUser.firstName);
      }
    };
  }, [userType, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (currentUser && ticket && socket) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Emit typing event
      socket.emit("userTyping", {
        ticketId: ticket._id,
        user: currentUser.firstName,
      });

      // Set timeout to emit stopped typing after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        socket.emit("userStoppedTyping", {
          ticketId: ticket._id,
          user: currentUser.firstName,
        });
      }, 2000);

      setTypingTimeout(timeout);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (
      (!message.trim() && !selectedFile) ||
      !ticket ||
      !currentUser ||
      !socket
    )
      return;

    setIsLoading(true);

    try {
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      socket.emit("userStoppedTyping", {
        ticketId: ticket._id,
        user: currentUser.firstName,
      });

      // Prepare message data
      const messageData = {
        ticketId: ticket._id,
        sender: currentUser._id,
        message: message.trim(),
      };

      // Upload file to AWS S3 if selected
      if (selectedFile) {
        const { signedUrl, filePath } = await uploadFileToS3(selectedFile);
        messageData.imageUrl = signedUrl;
        messageData.filePath = filePath; // Store the file path
      }

      // Send message via socket
      socket.emit("sendMessage", messageData);

      // Clear input and file
      setMessage("");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Fallback to API if socket fails
      try {
        const updatedTicket = await ApiService.addMessage(
          ticket._id,
          message.trim()
        );
        onTicketUpdated(updatedTicket);
        setMessage("");
        setSelectedFile(null);
        setPreviewUrl(null);
      } catch (apiError) {
        console.error("API fallback failed:", apiError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to upload file to AWS S3
  const uploadFileToS3 = async (file) => {
    // Use AWS SDK or call your backend to upload the file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", ticket._id);
    try {
      // Assuming you have an API endpoint for file upload
      const response = await ApiService.uploadFileToS3(formData);

      return response; // Assuming the response contains the file URL
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      throw new Error("File upload failed");
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const updatedTicket = await ApiService.changeTicketStatus(
        ticket._id,
        status
      );
      onTicketUpdated(updatedTicket);
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  const handleAssignToMe = async () => {
    if (!currentUser) return;
    try {
      const updatedTicket = await ApiService.assignTicket(
        ticket._id,
        currentUser._id
      );
      onTicketUpdated(updatedTicket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
    }
  };

  const handleAssignToAgent = async () => {
    if (!selectedAgent) return;

    try {
      const updatedTicket = await ApiService.assignTicket(
        ticket._id,
        selectedAgent
      );
      onTicketUpdated(updatedTicket);
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error("Error assigning ticket:", error);
    }
  };

  const handleCloseTicket = async () => {
    try {
      const updatedTicket = await ApiService.closeTicket(ticket._id);
      onTicketUpdated(updatedTicket);
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleMessageRead = (messageId) => {
    if (currentUser && ticket && messageId && socket) {
      socket.emit("messageRead", {
        ticketId: ticket._id,
        messageId,
        user: currentUser.firstName,
      });

      // Update local state
      setReadMessages((prev) => ({
        ...prev,
        [messageId]: true,
      }));
    }
  };

  // Mark messages as seen when they come into view
  const observeMessage = (messageId) => {
    if (currentUser && ticket && messageId && socket) {
      socket.emit("messageSeen", {
        ticketId: ticket._id,
        messageId,
        user: currentUser.firstName,
      });

      // Update local state
      setSeenMessages((prev) => ({
        ...prev,
        [messageId]: true,
      }));
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setModalImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!ticket) {
    return (
      <div className="card chat-container">
        <div className="chat-empty">
          <p>Select a ticket to view the conversation</p>
        </div>
      </div>
    );
  }

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

  // Format the assignee name based on the structure in your data
  const getAssigneeName = (assignee) => {
    if (!assignee) return "Unassigned";

    // Check if the assignee has firstName and lastName properties
    if (assignee.firstName && assignee.lastName) {
      return `${assignee.firstName} ${assignee.lastName}`;
    }

    // Otherwise use the name property
    return assignee.name || "Unknown";
  };

  return (
    <div className="card chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2 className="chat-header-title">{ticket.title}</h2>
          <p className="chat-header-subtitle">
            {userType === "agent"
              ? `Customer: ${
                  ticket.customer?.name ||
                  (ticket.customer?.firstName && ticket.customer?.lastName
                    ? ticket.customer.firstName + " " + ticket.customer.lastName
                    : "Unknown")
                }`
              : `Agent: ${getAssigneeName(ticket.assignee)}`}
          </p>
        </div>
        <div className="chat-header-actions">
          <span className={`badge ${getStatusClass(ticket.status)}`}>
            {ticket.status}
          </span>

          {userType === "agent" && (
            <div className="flex space-x">
              {!ticket.assignee && (
                <button
                  className="button button-default button-sm"
                  onClick={handleAssignToMe}
                >
                  Assign to me
                </button>
              )}

              <button
                className="button button-outline button-sm"
                onClick={() => setIsAssignDialogOpen(true)}
              >
                Assign to Agent
              </button>

              {isAssignDialogOpen && (
                <div
                  className="dialog-overlay"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  <div
                    className="dialog-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="dialog-header">
                      <h3 className="dialog-title">Assign Ticket to Agent</h3>
                    </div>
                    <div className="dialog-body">
                      <div className="form-group">
                        <label className="form-label">Select Agent</label>
                        <select
                          className="form-select"
                          value={selectedAgent}
                          onChange={(e) => setSelectedAgent(e.target.value)}
                        >
                          <option value="">Select an agent</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.firstName && agent.lastName
                                ? `${agent.firstName} ${agent.lastName}`
                                : agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="dialog-footer">
                      <button
                        className="button button-outline"
                        onClick={() => setIsAssignDialogOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="button button-default"
                        onClick={handleAssignToAgent}
                        disabled={!selectedAgent}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {ticket.status !== "closed" && (
                <>
                  <div
                    className="form-select-wrapper"
                    style={{ width: "130px" }}
                  >
                    <select
                      className="form-select"
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <button
                    className="button button-destructive button-sm"
                    onClick={handleCloseTicket}
                  >
                    Close Ticket
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {ticket.messages &&
          ticket.messages.map((msg, index) => {
            // Determine if the message is from the customer
            const isCustomer =
              msg.sender === ticket.customer?.id ||
              (ticket.customer?._id && msg.sender === ticket.customer._id);

            // Determine if the message is from the current user
            const isCurrentUser =
              currentUser &&
              (msg.sender === currentUser.id || msg.sender === currentUser._id);

            // Set appropriate classes
            let messageClass = "chat-message";
            let bubbleClass = "chat-message-bubble";

            if (isCurrentUser) {
              messageClass += " chat-message-current-user";
              bubbleClass += " chat-message-bubble-current-user";
            } else if (isCustomer) {
              messageClass += " chat-message-customer";
              bubbleClass += " chat-message-bubble-customer";
            } else {
              messageClass += " chat-message-agent";
              bubbleClass += " chat-message-bubble-agent";
            }

            // Add read/seen status indicators
            const messageId = msg.id || msg._id || `msg-${index}`;
            const isRead = readMessages[messageId];
            const isSeen = seenMessages[messageId];

            return (
              <div
                key={messageId}
                className={messageClass}
                onClick={() => handleMessageRead(messageId)}
                onMouseEnter={() => observeMessage(messageId)}
              >
                <div className={bubbleClass}>
                  <p>{msg.message || msg.content}</p>

                  {msg.imageUrl && (
                    <ChatImage key={msg.id} filePath={msg.filePath} />
                  )}

                  <div className="chat-message-footer">
                    <span className="chat-message-time">
                      {format(
                        new Date(msg.timestamp || msg.createdAt),
                        "MMM d, h:mm a"
                      )}
                    </span>

                    {isCurrentUser && (
                      <span className="chat-message-status">
                        {isRead ? "✓✓" : isSeen ? "✓" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {isTyping && (
          <div className="chat-typing-indicator">{typingUser} is typing...</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {ticket.status !== "closed" && (
        <div className="chat-input">
          <form onSubmit={handleSendMessage} className="chat-input-form">
            {selectedFile && (
              <div className="file-upload-preview">
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" />
                <div className="file-upload-info">
                  <div className="file-upload-name">{selectedFile.name}</div>
                  <div className="file-upload-size">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <div className="file-upload-remove" onClick={handleRemoveFile}>
                  ✕
                </div>
              </div>
            )}

            <div className="chat-input-main">
              <input
                className="form-input flex-grow"
                value={message}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                className="button button-default"
                type="submit"
                disabled={isLoading || (!message.trim() && !selectedFile)}
              >
                Send
              </button>
            </div>

            <div className="file-upload-container">
              <label className="file-upload-button">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                📎 Attach Image
              </label>
            </div>
          </form>
        </div>
      )}

      {/* {imageModalOpen && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content">
            <img src={modalImage || "/placeholder.svg"} alt="Full size" />
          </div>
        </div>
      )} */}
    </div>
  );
}
