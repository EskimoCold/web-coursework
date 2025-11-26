import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

import { HomePage } from '../components/HomePage';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { SettingsPage } from '../components/SettingsPage';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { CategoryProvider } from '../contexts/CategoriesContext';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { CategoriesPage } from '../pages/categories/CategoriesPage';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

const TITLES: Record<string, string> = {
  '/': 'Главная',
  '/analytics': 'Аналитика',
  '/categories': 'Категории',
  '/settings': 'Настройки',
};

export function MainLayout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || 'FinTrack';

  return (
    <div className="app-root">
      <Sidebar />
      <Layout title={title}>
        <Outlet />
      </Layout>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CategoryProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/main" element={<HomePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/main" replace />} />
          </Routes>
        </CategoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
