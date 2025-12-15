import React from 'react';

import './settings.css';

import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

import { DeleteAccountModal } from './DeleteAccountModal';
import { useSettingsStore, SettingsSection } from './settingsStore';
import { useShallow } from 'zustand/react/shallow';

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
};

function ChangePasswordModal({ isOpen, onClose, accessToken }: ChangePasswordModalProps) {
  const {
    passwordForm: { oldPassword, newPassword, confirmPassword, error, success, isLoading },
    updatePasswordField,
    setPasswordError,
    setPasswordSuccess,
    setPasswordLoading,
    resetPasswordForm,
  } = useSettingsStore(
    useShallow((state) => ({
      passwordForm: state.passwordForm,
      updatePasswordField: state.updatePasswordField,
      setPasswordError: state.setPasswordError,
      setPasswordSuccess: state.setPasswordSuccess,
      setPasswordLoading: state.setPasswordLoading,
      resetPasswordForm: state.resetPasswordForm,
    })),
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setPasswordLoading(true);
    try {
      if (!accessToken) throw new Error('Не авторизован');

      await authApi.changePassword(
        { old_password: oldPassword, new_password: newPassword },
        accessToken,
      );
      setPasswordSuccess('Пароль успешно изменен');
      updatePasswordField('oldPassword', '');
      updatePasswordField('newPassword', '');
      updatePasswordField('confirmPassword', '');
      setTimeout(() => {
        onClose();
        setPasswordSuccess('');
      }, 2000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка при смене пароля');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClose = () => {
    resetPasswordForm();
    onClose();
  };

  return (
    <div className="settings-modal">
      <div className="settings-modal-bg" onClick={handleClose} />
      <div className="settings-modal-content">
        <h3 className="settings-section-title" style={{ fontSize: '20px' }}>
          Смена пароля
        </h3>
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="settings-form-group">
            <label className="settings-form-label">Текущий пароль</label>
            <input
              type="password"
              className="settings-form-input"
              value={oldPassword}
              onChange={(e) => updatePasswordField('oldPassword', e.target.value)}
              required
            />
          </div>
          <div className="settings-form-group">
            <label className="settings-form-label">Новый пароль</label>
            <input
              type="password"
              className="settings-form-input"
              value={newPassword}
              onChange={(e) => updatePasswordField('newPassword', e.target.value)}
              required
            />
          </div>
          <div className="settings-form-group">
            <label className="settings-form-label">Подтвердите новый пароль</label>
            <input
              type="password"
              className="settings-form-input"
              value={confirmPassword}
              onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>}
          {success && <div style={{ color: '#059669', fontSize: '14px' }}>{success}</div>}

          <div className="settings-form-actions">
            <button type="button" className="settings-button" onClick={handleClose} disabled={isLoading}>
              Отмена
            </button>
            <button type="submit" className="settings-button primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SecuritySection() {
  const { accessToken } = useAuth();
  const isPasswordModalOpen = useSettingsStore((state) => state.isPasswordModalOpen);
  const isDeleteAccountModalOpen = useSettingsStore((state) => state.isDeleteAccountModalOpen);
  const setPasswordModalOpen = useSettingsStore((state) => state.setPasswordModalOpen);
  const setDeleteAccountModalOpen = useSettingsStore((state) => state.setDeleteModalOpen);
  const resetPasswordForm = useSettingsStore((state) => state.resetPasswordForm);
  const resetDeleteState = useSettingsStore((state) => state.resetDeleteState);

  const closePasswordModal = () => {
    resetPasswordForm();
    setPasswordModalOpen(false);
  };

  const closeDeleteModal = () => {
    resetDeleteState();
    setDeleteAccountModalOpen(false);
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Безопасность</h2>
      <p className="settings-section-description">Настройки входа и защиты данных</p>

      <div className="settings-items">
        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Смена пароля</h3>
            <p className="settings-item-description">Обновите ваш пароль для защиты аккаунта</p>
          </div>
          <button className="settings-button primary" onClick={() => setPasswordModalOpen(true)}>
            Сменить пароль
          </button>
        </div>

        <div className="settings-item danger">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Удаление аккаунта</h3>
            <p className="settings-item-description">Безвозвратное удаление всех данных</p>
          </div>
          <button
            className="settings-button danger"
            onClick={() => setDeleteAccountModalOpen(true)}
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        accessToken={accessToken}
      />
      <DeleteAccountModal isOpen={isDeleteAccountModalOpen} onClose={closeDeleteModal} />
    </div>
  );
}

function DataManagementSection() {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Управление данными</h2>
      <p className="settings-section-description">Экспорт, импорт и резервное копирование</p>

      <div className="settings-item">
        <div className="settings-item-content">
          <h3 className="settings-item-title">Экспорт данных</h3>
          <p className="settings-item-description">Выгрузить все данные в файл</p>
        </div>
        <div className="settings-button-group">
          <button className="settings-button secondary">JSON</button>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-content">
          <h3 className="settings-item-title">Импорт данных</h3>
          <p className="settings-item-description">Загрузить данные из файла</p>
        </div>
        <button className="settings-button primary">Выбрать файл</button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const theme = useSettingsStore((state) => state.theme);
  const currency = useSettingsStore((state) => state.currency);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setCurrency = useSettingsStore((state) => state.setCurrency);

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Внешний вид</h2>
      <p className="settings-section-description">Тема и валюта</p>

      <div className="settings-items">
        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Тема оформления</h3>
            <p className="settings-item-description">Выберите preferred тему интерфейса</p>
          </div>
          <select
            className="settings-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Светлая</option>
            <option value="dark">Темная</option>
            <option value="system">Системная</option>
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Валюта</h3>
            <p className="settings-item-description">Единица отображения сумм</p>
          </div>
          <select
            className="settings-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="RUB">RUB (₽)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const activeSection = useSettingsStore((state) => state.activeSection);
  const setActiveSection = useSettingsStore((state) => state.setActiveSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'security':
        return <SecuritySection />;
      case 'data':
        return <DataManagementSection />;
      case 'appearance':
      default:
        return <AppearanceSection />;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-header">
          <div>
            <h1 className="settings-title">Настройки</h1>
            <p className="settings-subtitle">Управление аккаунтом и предпочтениями</p>
          </div>
        </div>

        <div className="settings-content">
          <div className="settings-nav">
            <button
              className={`settings-nav-button ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              Безопасность
            </button>
            <button
              className={`settings-nav-button ${activeSection === 'data' ? 'active' : ''}`}
              onClick={() => setActiveSection('data')}
            >
              Данные
            </button>
            <button
              className={`settings-nav-button ${activeSection === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveSection('appearance')}
            >
              Внешний вид
            </button>
          </div>

          <div className="settings-section-container">{renderSection()}</div>
        </div>
      </div>
    </div>
  );
}
