import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Sidebar } from '../components/Sidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';

function MainApp() {
  const [active, setActive] = useState('Категории');
  return (
    <div className="app-root">
      <Sidebar active={active} onSelect={setActive} />
      <Layout title={active}>
        <div aria-label="content-placeholder" className="content-placeholder" />
      </Layout>
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
