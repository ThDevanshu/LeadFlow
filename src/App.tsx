import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AppProvider } from './context/AppContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { ToastProvider } from './context/ToastContext'
import { UiProvider } from './context/UiContext'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { FollowUpsPage } from './pages/FollowUpsPage'
import { LeadDetailPage } from './pages/LeadDetailPage'
import { LeadsPage } from './pages/LeadsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PipelinePage } from './pages/PipelinePage'
import { PropertiesPage, PropertyDetailPage } from './pages/PropertiesPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AppProvider>
            <UiProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="leads/:leadId" element={<LeadDetailPage />} />
                  <Route path="follow-ups" element={<FollowUpsPage />} />
                  <Route path="pipeline" element={<PipelinePage />} />
                  <Route path="properties" element={<PropertiesPage />} />
                  <Route path="properties/:propertyId" element={<PropertyDetailPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </UiProvider>
          </AppProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
