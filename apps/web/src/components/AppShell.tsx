import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Topbar, MobileBackdrop } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Topbar variant="app" onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <MobileBackdrop open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 px-4 py-5 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PublicShell() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Topbar variant="public" />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
