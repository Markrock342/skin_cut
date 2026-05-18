import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AuthProvider } from './context/AuthContext';
import { StudioProvider } from './context/StudioContext';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { StudioPage } from './pages/StudioPage';
import { TopupPage } from './pages/TopupPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RegisterSuccessPage } from './pages/RegisterSuccessPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ContractPage } from './pages/ContractPage';
import { ContactPage } from './pages/ContactPage';
import { TermsEnPage } from './pages/TermsEnPage';
import { PrivacyEnPage } from './pages/PrivacyEnPage';
import { ContractEnPage } from './pages/ContractEnPage';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { CookieConsent } from './components/CookieConsent';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsTracker />
        <StudioProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
              <Route path="contacts" element={<AdminContactsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="games" element={<GamesPage />} />
              <Route path="studio/:gameId" element={<StudioPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="register/success" element={<RegisterSuccessPage />} />
              <Route
                path="topup"
                element={
                  <ProtectedRoute>
                    <TopupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="contract" element={<ContractPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="en/terms" element={<TermsEnPage />} />
              <Route path="en/privacy" element={<PrivacyEnPage />} />
              <Route path="en/contract" element={<ContractEnPage />} />
            </Route>
          </Routes>
          <CookieConsent />
        </StudioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
