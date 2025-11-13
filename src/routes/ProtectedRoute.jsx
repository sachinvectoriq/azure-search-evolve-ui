import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children, requireReportsAccess = false }) => {
  const { user } = useAuth();

  const storedGroup = JSON.parse(localStorage.getItem("group") || '""');
  const storedEmail = JSON.parse(localStorage.getItem("email") || '""');
  const storedReportAccess = JSON.parse(localStorage.getItem("hasReportAccess") || "false");

  const group = user?.group || storedGroup;

  // Admins always have full access
  if (group === "admin") return children;

  // Protect Reports route
  if (requireReportsAccess && !storedReportAccess) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
