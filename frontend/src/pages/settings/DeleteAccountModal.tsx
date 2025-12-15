import React from 'react';

import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useSettingsStore } from './settingsStore';
import { useShallow } from 'zustand/react/shallow';

export type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteAccountModal: React.FC<Props> = ({ isOpen, onClose }: Props) => {
  const {
    deleteState: { error, isLoading },
    setDeleteError,
    setDeleteLoading,
    resetDeleteState,
  } = useSettingsStore(
    useShallow((state) => ({
      deleteState: state.deleteState,
      setDeleteError: state.setDeleteError,
      setDeleteLoading: state.setDeleteLoading,
      resetDeleteState: state.resetDeleteState,
    })),
  );
  const { logout, accessToken } = useAuth();

  if (!isOpen) return null;

  const handleClose = () => {
    resetDeleteState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);

    try {
      if (!accessToken) throw new Error('Не авторизован');

      await authApi.deleteAccount(accessToken);

      setTimeout(() => {
        logout();
        handleClose();
      }, 1000);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Ошибка при удалении аккаунта');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-modal-bg" onClick={handleClose} />
      <div className="settings-modal-content">
        <h3 className="settings-section-title" style={{ fontSize: '20px' }}>
          Вы уверены? Отменить или остановить действие будет невозможно
        </h3>
        <form onSubmit={handleSubmit} className="settings-form">
          {error && <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>}
          <div className="settings-form-actions">
            <button type="button" className="settings-button" onClick={handleClose} disabled={isLoading}>
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
};
