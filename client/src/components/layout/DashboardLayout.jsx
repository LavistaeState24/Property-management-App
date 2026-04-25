import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleBreakpointChange = (event) => {
      setIsDesktop(event.matches);
      setIsSidebarOpen(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    setIsSidebarOpen(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleBreakpointChange);
      return () => mediaQuery.removeEventListener("change", handleBreakpointChange);
    }

    mediaQuery.addListener(handleBreakpointChange);
    return () => mediaQuery.removeListener(handleBreakpointChange);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-ink bg-glow text-ivory">
      <Navbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-black/45 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <div className={`transition-[padding] duration-300 ${isDesktop && isSidebarOpen ? "lg:pl-64" : "lg:pl-0"}`}>
        <main className="min-h-screen px-4 pb-8 pt-20 sm:px-6 lg:px-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
