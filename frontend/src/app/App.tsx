import { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { initAnalytics, trackPageview } from '../analytics/googleAnalytics';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { CategoryProvider } from '../contexts/CategoriesContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { HomePage } from '../pages/home/HomePage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { useNavigationStore } from '../stores/navigationStore';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}

function MainApp() {
  const active = useNavigationStore((state) => state.activePage);
  const setActive = useNavigationStore((state) => state.setActivePage);

  const pages = useMemo(
    () =>
      new Map<string, JSX.Element>([
        ['Главная', <HomePage key={0} />],
        ['Настройки', <SettingsPage key={0} />],
        ['Категории', <CategoriesPage key={0} />],
        ['Аналитика', <AnalyticsPage key={0} />],
      ]),
    [],
  );

  const renderContent = () =>
    pages.get(active) || <div aria-label="content-placeholder" className="content-placeholder" />;

  return (
    <CategoryProvider>
      <CurrencyProvider>
        <div className="app-root">
          <Sidebar active={active} onSelect={setActive} />
          <Layout title={active}>{renderContent()}</Layout>
        </div>
      </CurrencyProvider>
    </CategoryProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsTracker />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
