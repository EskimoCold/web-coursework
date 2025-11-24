import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { CategoryProvider } from '../contexts/CategoriesContext';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { HomePage } from '../pages/home/HomePage';
import { SettingsPage } from '../pages/settings/SettingsPage';

function MainApp() {
  const [active, setActive] = useState('Главная');

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
      <div className="app-root">
        <Sidebar active={active} onSelect={setActive} />
        <Layout title={active}>{renderContent()}</Layout>
      </div>
    </CategoryProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
