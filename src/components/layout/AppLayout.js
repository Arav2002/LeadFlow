/* eslint-disable */
import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <div className="topbar">
          {/* Burger button — mobile only */}
          <button
            className="burger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <i className="fa-solid fa-bars" />
          </button>
          <div className="topbar-title">{title}</div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}