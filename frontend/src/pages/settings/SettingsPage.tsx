import { useState } from 'react';

import './settings.css';

import { authApi } from '../../api/auth';

import { DeleteAccountModal } from './DeleteAccountModal';

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Не авторизован');

      await authApi.changePassword({ old_password: oldPassword, new_password: newPassword }, token);
      setSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при смене пароля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-modal">
      <div className="settings-modal-bg" onClick={onClose} />
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
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="settings-form-group">
            <label className="settings-form-label">Новый пароль</label>
            <input
              type="password"
              className="settings-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="settings-form-group">
            <label className="settings-form-label">Подтвердите новый пароль</label>
            <input
              type="password"
              className="settings-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>}
          {success && <div style={{ color: '#059669', fontSize: '14px' }}>{success}</div>}

          <div className="settings-form-actions">
            <button
              type="button"
              className="settings-button"
              onClick={onClose}
              disabled={isLoading}
            >
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

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
          <button className="settings-button primary" onClick={() => setIsPasswordModalOpen(true)}>
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
            onClick={() => setIsDeleteAccountModalOpen(true)}
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />
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
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('RUB');

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
            <option value="auto">Системная</option>
          </select>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Валюта</h3>
            <p className="settings-item-description">Основная валюта для отображения сумм</p>
          </div>
          <select
            className="settings-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="RUB">Рубли (RUB)</option>
            <option value="USD">Доллары (USD)</option>
            <option value="EUR">Евро (EUR)</option>
            <option value="CNY">Юани (CNY)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">О приложении</h2>
      <p className="settings-section-description">Информация и поддержка</p>

      <div className="settings-items">
        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Версия приложения</h3>
            <p className="settings-item-description">FinTrack v1.0.0</p>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Лицензия</h3>
            <p className="settings-item-description">MIT License</p>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Поддержка</h3>
            <p className="settings-item-description">support@fintrack.ru</p>
          </div>
          <button className="settings-button secondary">Написать</button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Политика конфиденциальности</h3>
            <p className="settings-item-description">Как мы защищаем ваши данные</p>
          </div>
          <button className="settings-button secondary">Открыть</button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Условия использования</h3>
            <p className="settings-item-description">Правила работы с приложением</p>
          </div>
          <button className="settings-button secondary">Открыть</button>
        </div>
      </div>
    </div>
  );
}

type Section = 'security' | 'data' | 'appearance' | 'about';

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('security');

  const sections = [
    {
      id: 'security' as Section,
      label: 'Безопасность',
      description: 'Настройки входа и защиты данных',
    },
    {
      id: 'data' as Section,
      label: 'Управление данными',
      description: 'Экспорт, импорт и резервное копирование',
    },
    { id: 'appearance' as Section, label: 'Внешний вид', description: 'Тема, язык и валюта' },
    { id: 'about' as Section, label: 'О приложении', description: 'Информация и поддержка' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-sidebar">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <div className="settings-nav-content">
              <span className="settings-nav-label">{section.label}</span>
              <span className="settings-nav-description">{section.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'data' && <DataManagementSection />}
        {activeSection === 'appearance' && <AppearanceSection />}
        {activeSection === 'about' && <AboutSection />}
      </div>
    </div>
  );
}
