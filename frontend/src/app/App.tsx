import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from '../components/Layout';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { SettingsPage } from '../components/SettingsPage';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

function MainApp() {
  const [active, setActive] = useState('Категории');

  const renderContent = () => {
    if (active === 'Настройки') {
      return <SettingsPage />;
    }

    return <div aria-label="content-placeholder" className="content-placeholder" />;
  };

  return (
    <div className="app-root">
      <Sidebar active={active} onSelect={setActive} />
      <Layout title={active}>{renderContent()}</Layout>
    </div>
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
