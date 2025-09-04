import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import DataAnalysis from "./components/DataAnalysis";
import DataPreview from "./components/DataPreview";
import FileHistory from "./components/FileHistory";
import VisualAnalysis from "./components/VisualAnalysis";
import ModelEvaluation from "./components/ModelEvaluation"; // NEW
import { FaUpload, FaChartBar, FaTable, FaHistory, FaChartPie, FaRobot } from "react-icons/fa";

// Sidebar link component
const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: active ? "#374151" : "transparent",
        transition: "all 0.2s",
        textDecoration: "none",
        fontWeight: active ? "600" : "400",
      }}
      onMouseEnter={(e) => (e.target.style.backgroundColor = "#4b5563")}
      onMouseLeave={(e) => (e.target.style.backgroundColor = active ? "#374151" : "transparent")}
    >
      {icon} {label}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "250px",
            backgroundColor: "#1f2937",
            color: "white",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginBottom: "40px", textAlign: "center", color: "#fbbf24" }}>
            AI Dashboard
          </h2>
          <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <SidebarLink to="/upload" icon={<FaUpload />} label="Upload" />
            <SidebarLink to="/analysis" icon={<FaChartBar />} label="Data Analysis" />
            <SidebarLink to="/preview" icon={<FaTable />} label="Data Preview" />
            <SidebarLink to="/visual" icon={<FaChartPie />} label="Visual Analysis" />
            <SidebarLink to="/history" icon={<FaHistory />} label="File History" />
            <SidebarLink to="/model-eval" icon={<FaRobot />} label="Model Evaluation" /> {/* NEW */}
          </nav>
        </div>

        {/* Main Content */}
        <div
          style={{
            flexGrow: 1,
            padding: "30px",
            backgroundColor: "#f3f4f6",
            overflowY: "auto",
            minHeight: "100vh",
          }}
        >
          <Routes>
            <Route path="/upload" element={<FileUpload />} />
            <Route path="/analysis" element={<DataAnalysis />} />
            <Route path="/preview" element={<DataPreview />} />
            <Route path="/visual" element={<VisualAnalysis />} />
            <Route path="/history" element={<FileHistory />} />
            <Route path="/model-eval" element={<ModelEvaluation />} /> {/* NEW */}
            <Route
              path="/"
              element={
                <div style={{ textAlign: "center", marginTop: "100px" }}>
                  <h1 style={{ fontSize: "3rem", color: "#1f2937" }}>Welcome to AI Data Dashboard</h1>
                  <p style={{ fontSize: "1.2rem", color: "#374151", marginTop: "20px" }}>
                    Select an option from the sidebar to start analyzing your data.
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
