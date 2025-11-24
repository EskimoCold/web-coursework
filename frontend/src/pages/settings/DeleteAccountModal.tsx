import { useState } from "react";
import { authApi } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  isOpen: boolean,
  onClose: () => void
}

export const DeleteAccountModal: React.FC<Props> = ({isOpen, onClose}: Props) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) throw new Error('Не авторизован');

      await authApi.deleteAccount(accessToken);
      
      setTimeout(() => {
        logout();
        onClose();
      }, 1000);

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

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
          Вы уверены? Отменить или остановить действие будет невозможно
        </h3>
        <form onSubmit={handleSubmit} className="settings-form">
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
              {isLoading ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}