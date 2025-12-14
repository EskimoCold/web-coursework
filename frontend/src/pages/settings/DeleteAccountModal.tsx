import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!accessToken) throw new Error('Не авторизован');

      // Здесь должен быть вызов API для удаления аккаунта
      // Пока что просто выходим из системы
      await logout();
      navigate('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении аккаунта');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-modal-bg" onClick={onClose} />
      <div className="settings-modal-content">
        <h3 className="settings-section-title" style={{ fontSize: '20px' }}>
          Удаление аккаунта
        </h3>
        <p style={{ marginBottom: '16px', color: '#dc2626' }}>
          Это действие необратимо. Все ваши данные будут удалены.
        </p>
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="settings-form-group">
            <label className="settings-form-label">Подтвердите паролем</label>
            <input
              type="password"
              className="settings-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>}

          <div className="settings-form-actions">
            <button
              type="button"
              className="settings-button"
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button type="submit" className="settings-button danger" disabled={isLoading}>
              {isLoading ? 'Удаление...' : 'Удалить аккаунт'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

