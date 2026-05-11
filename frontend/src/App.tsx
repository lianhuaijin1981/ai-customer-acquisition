import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import LeadsPage from '@/pages/leads/LeadsPage'
import OutreachPage from '@/pages/outreach/OutreachPage'
import CrmPage from '@/pages/crm/CrmPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import RiskPage from '@/pages/risk/RiskPage'
import AccountsPage from '@/pages/accounts/AccountsPage'
import TemplatesPage from '@/pages/outreach/TemplatesPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import LoginPage from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/outreach" element={<OutreachPage />} />
          <Route path="/outreach/templates" element={<TemplatesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
