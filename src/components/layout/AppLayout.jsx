import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AccessGuard from './AccessGuard';

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          <AccessGuard>
            <Outlet />
          </AccessGuard>
        </div>
      </main>
    </div>
  );
}