const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ApiService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("Invalid credentials");
      const data = await response.json();
      localStorage.setItem("token", data.accessToken);
      return data;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/current-user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Unauthorized");
      return await response.json();
    } catch (error) {
      console.error("Get Current User Error:", error);
      return null;
    }
  },

  getAllTickets: async ({
    page,
    take,
    sortBy,
    sortOrder,
    search,
    status,
    priority,
    dateRange,
    assignee,
  }) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: take.toString(),
        sortBy,
        sortOrder,
      });
      if (search) queryParams.append("search", search);
      if (status) queryParams.append("status", status);
      if (priority) queryParams.append("priority", priority);
      if (dateRange) {
        const { startDate, endDate } = dateRange;
        if (startDate)
          queryParams.append("startDate", new Date(startDate).toISOString());
        if (endDate)
          queryParams.append("endDate", new Date(endDate).toISOString());
      }
      if (assignee) queryParams.append("assignee", assignee);

      const token = localStorage.getItem("token");

      // Build query string from params
      const queryString = new URLSearchParams(queryParams).toString();

      const response = await fetch(`${API_BASE_URL}/ticket?${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch tickets");
      return await response.json();
    } catch (error) {
      console.error("Get All Tickets Error:", error);
      throw error;
    }
  },

  getCustomerTickets: async ({
    page,
    take,
    sortBy,
    sortOrder,
    search,
    status,
  }) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: take.toString(),
      sortBy,
      sortOrder,
    });

    const token = localStorage.getItem("token");

    if (search) queryParams.append("search", search);
    if (status) queryParams.append("status", status);

    const res = await fetch(
      `${API_BASE_URL}/ticket/customer-tickets?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch customer tickets");
    }

    return res.json();
  },

  getTicketById: async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/ticket/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch ticket");
      return await response.json();
    } catch (error) {
      console.error("Get Ticket By ID Error:", error);
      throw error;
    }
  },

  createTicket: async (ticketData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) throw new Error("Failed to create ticket");
      return await response.json();
    } catch (error) {
      console.error("Create Ticket Error:", error);
      throw error;
    }
  },

  assignTicket: async (ticketId, assigneeId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ticket/${ticketId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ assigneeId }),
        }
      );
      if (!response.ok) throw new Error("Failed to assign ticket");
      return await response.json();
    } catch (error) {
      console.error("Assign Ticket Error:", error);
      throw error;
    }
  },

  changeTicketStatus: async (ticketId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/ticket/${ticketId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error("Failed to change ticket status");
      return await response.json();
    } catch (error) {
      console.error("Change Ticket Status Error:", error);
      throw error;
    }
  },

  closeTicket: async (ticketId) => {
    return ApiService.changeTicketStatus(ticketId, "closed");
  },

  addMessage: async (ticketId, message, file) => {
    try {
      const token = localStorage.getItem("token");

      if (file) {
        const formData = new FormData();
        formData.append("message", message);
        formData.append("file", file);

        const response = await fetch(
          `${API_BASE_URL}/ticket/${ticketId}/message`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
        if (!response.ok) throw new Error("Failed to add message with file");
        return await response.json();
      } else {
        const response = await fetch(
          `${API_BASE_URL}/ticket/${ticketId}/message`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
          }
        );
        if (!response.ok) throw new Error("Failed to add message");
        return await response.json();
      }
    } catch (error) {
      console.error("Add Message Error:", error);
      throw error;
    }
  },

  fetchAgents: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized: No token provided");

      const response = await fetch(`${API_BASE_URL}/users/agents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Response Text:", text);
        throw new Error("Failed to fetch agents");
      }
      return await response.json();
    } catch (error) {
      console.error("Fetch Agents Error:", error);
      throw error;
    }
  },

  decodeToken: (token) => {
    try {
      if (!token) return null;
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error("Decode Token Error:", error);
      return null;
    }
  },

  getRole: () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const decodedToken = ApiService.decodeToken(token);
      return decodedToken?.role || null;
    } catch (error) {
      console.error("Get Role Error:", error);
      return null;
    }
  },

  uploadFileToS3: async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/aws/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file to S3");
      const data = await response.json();
      const signedUrl = data.signedUrl;
      const filePath = data.filePath;
      return { signedUrl, filePath };
    } catch (error) {
      console.error("Upload File to S3 Error:", error);
      throw error;
    }
  },
  refreshSignedUrl: async (filePath) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/aws/refresh-url?filePath=${encodeURIComponent(
          filePath
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to refresh signed URL");
      const data = await response.json();
      return data.signedUrl;
    } catch (err) {
      console.error("Failed to refresh signed URL:", err);
      return null;
    }
  },
};

export default ApiService;
