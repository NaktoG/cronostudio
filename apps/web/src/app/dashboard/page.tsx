'use client';

import { Suspense } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { DashboardContent } from '../page';
import { DASHBOARD_COPY } from '../content/dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300">{DASHBOARD_COPY.loading.dashboard}</p>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
