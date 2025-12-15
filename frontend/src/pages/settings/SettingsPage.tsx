import { useState, useRef } from 'react';

import './settings.css';

import { authApi } from '../../api/auth';
import { usersApi } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';

import { DeleteAccountModal } from './DeleteAccountModal';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
};

function ChangePasswordModal({ isOpen, onClose, accessToken }: ChangePasswordModalProps) {
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
      if (!accessToken) throw new Error('Не авторизован');

      await authApi.changePassword(
        { old_password: oldPassword, new_password: newPassword },
        accessToken,
      );
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
  const { accessToken } = useAuth();

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
        accessToken={accessToken}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
      />
    </div>
  );
}

function DataManagementSection() {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const blob = await usersApi.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Export error:', error);
      alert(`Ошибка при экспорте данных: ${errorMessage}\n\nУбедитесь, что:\n- Вы авторизованы в системе\n- Бэкенд запущен и доступен\n- Эндпоинт /api/v1/users/me/export доступен`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setImportMessage({ type: 'error', text: 'Пожалуйста, выберите JSON файл' });
      return;
    }

    try {
      setImportLoading(true);
      setImportMessage(null);
      const result = await usersApi.importData(file);
      setImportMessage({
        type: 'success',
        text: `Импорт завершен: ${result.imported_categories} категорий, ${result.imported_transactions} транзакций`,
      });
      if (result.errors && result.errors.length > 0) {
        console.warn('Ошибки при импорте:', result.errors);
      }
      // Перезагружаем страницу через 2 секунды для обновления данных
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setImportMessage({
        type: 'error',
        text: 'Ошибка при импорте: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'),
      });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Управление данными</h2>
      <p className="settings-section-description">Экспорт, импорт и резервное копирование</p>

      <div className="settings-items">
        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Экспорт данных</h3>
            <p className="settings-item-description">Выгрузить все данные в файл</p>
          </div>
          <div className="settings-button-group">
            <button
              className="settings-button secondary"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? 'Экспорт...' : 'JSON'}
            </button>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Импорт данных</h3>
            <p className="settings-item-description">Загрузить данные из файла</p>
            {importMessage && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  color: importMessage.type === 'success' ? '#059669' : '#dc2626',
                }}
              >
                {importMessage.text}
              </p>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
              disabled={importLoading}
            />
            <button
              className="settings-button primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
            >
              {importLoading ? 'Импорт...' : 'Выбрать файл'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState('light');
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();

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
            onChange={(e) => setCurrency(e.target.value as 'RUB' | 'USD' | 'EUR' | 'CNY')}
          >
            <option value="RUB">Рубли (RUB) ₽</option>
            <option value="USD">Доллары (USD) $</option>
            <option value="EUR">Евро (EUR) €</option>
            <option value="CNY">Юани (CNY) ¥</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

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
          <button
            className="settings-button secondary"
            onClick={() => setIsPrivacyModalOpen(true)}
          >
            Открыть
          </button>
        </div>

        <div className="settings-item">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Условия использования</h3>
            <p className="settings-item-description">Правила работы с приложением</p>
          </div>
          <button className="settings-button secondary">Открыть</button>
        </div>
      </div>

      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
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
