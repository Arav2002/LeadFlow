import React from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ title, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
