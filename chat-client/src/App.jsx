import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import CustomerLogin from "./pages/CustomerLogin"
import AgentLogin from "./pages/AgentLogin"
import CustomerDashboard from "./pages/CustomerDashboard"
import AgentDashboard from "./pages/AgentDashboard"
import "./index.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/customer" element={<CustomerLogin />} />
        <Route path="/agent" element={<AgentLogin />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

