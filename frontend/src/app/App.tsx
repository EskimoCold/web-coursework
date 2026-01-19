import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSettingsStore } from '../pages/settings/settingsStore';
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

  const { theme } = useSettingsStore();
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = useCallback((isDark: boolean) => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    const themeColor = isDark ? '#1e293b' : '#ffffff';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);

    document.querySelectorAll('meta[name="theme-color"][media]').forEach((meta) => {
      meta.setAttribute('content', themeColor);
    });
  }, []);

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    applyTheme(isDark);
  }, [theme, systemDark, applyTheme]);

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
          <Layout>{renderContent()}</Layout>
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
