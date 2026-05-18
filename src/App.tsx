import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { StudioProvider } from './context/StudioContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { CookieConsent } from './components/CookieConsent';

const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminContactsPage = lazy(() =>
  import('./pages/admin/AdminContactsPage').then((m) => ({ default: m.AdminContactsPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminHistoryPage = lazy(() =>
  import('./pages/admin/AdminHistoryPage').then((m) => ({ default: m.AdminHistoryPage })),
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const GamesPage = lazy(() => import('./pages/GamesPage').then((m) => ({ default: m.GamesPage })));
const StudioPage = lazy(() => import('./pages/StudioPage').then((m) => ({ default: m.StudioPage })));
const TopupPage = lazy(() => import('./pages/TopupPage').then((m) => ({ default: m.TopupPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const RegisterSuccessPage = lazy(() =>
  import('./pages/RegisterSuccessPage').then((m) => ({ default: m.RegisterSuccessPage })),
);
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ContractPage = lazy(() => import('./pages/ContractPage').then((m) => ({ default: m.ContractPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const TermsEnPage = lazy(() => import('./pages/TermsEnPage').then((m) => ({ default: m.TermsEnPage })));
const PrivacyEnPage = lazy(() => import('./pages/PrivacyEnPage').then((m) => ({ default: m.PrivacyEnPage })));
const ContractEnPage = lazy(() =>
  import('./pages/ContractEnPage').then((m) => ({ default: m.ContractEnPage })),
);
function RouteFallback() {
  return (
    <p style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)' }} aria-live="polite">
      กำลังโหลด…
    </p>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AnalyticsTracker />
          <StudioProvider>
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
            <CookieConsent />
          </StudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
