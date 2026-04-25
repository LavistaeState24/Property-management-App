import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-ink bg-glow px-4 py-4 text-ivory sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px,1fr]">
        <Sidebar />
        <div className="space-y-6">
          <Navbar />
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

