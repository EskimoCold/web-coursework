import { useState, useRef } from 'react';

import './settings.css';
import { authApi } from '../../api/auth';
import { categoriesApi } from '../../api/categories';
import { transactionsApi } from '../../api/transactions';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency, Currency } from '../../contexts/CurrencyContext';

import { DeleteAccountModal } from './DeleteAccountModal';

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
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const transactions = await transactionsApi.getTransactions();
      const categories = await categoriesApi.getCategories();

      const data = {
        transactions,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert('Ошибка при экспорте данных. Проверьте подключение к серверу.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportMessage(null);

      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Неверный формат файла. Ожидается массив транзакций.');
      }

      let importedCount = 0;
      let errorCount = 0;

      for (const transaction of data.transactions) {
        try {
          await transactionsApi.createTransaction({
            amount: transaction.amount,
            description: transaction.description || '',
            transaction_type: transaction.transaction_type,
            category_id: transaction.category_id || null,
            transaction_date:
              transaction.transaction_date || new Date().toISOString().split('T')[0],
          });
          importedCount++;
        } catch (error) {
          console.error('Ошибка импорта транзакции:', error);
          errorCount++;
        }
      }

      if (importedCount > 0) {
        setImportMessage(
          `Успешно импортировано: ${importedCount} транзакций${errorCount > 0 ? `. Ошибок: ${errorCount}` : ''}`,
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setImportMessage('Не удалось импортировать данные. Проверьте формат файла.');
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      setImportMessage(
        error instanceof Error
          ? error.message
          : 'Ошибка при импорте данных. Проверьте формат файла.',
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
          <button
            className="settings-button secondary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Экспорт...' : 'JSON'}
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
                fontSize: '12px',
                color: importMessage.includes('Успешно') ? '#059669' : '#dc2626',
              }}
            >
              {importMessage}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button
          className="settings-button primary"
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? 'Импорт...' : 'Выбрать файл'}
        </button>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState('light');

  const { currency, setCurrency } = useCurrency();

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
            onChange={(e) => setCurrency(e.target.value as Currency)}
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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  return (
    <>
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
            <button
              className="settings-button secondary"
              onClick={() => (window.location.href = 'mailto:support@fintrack.ru')}
            >
              Написать
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <h3 className="settings-item-title">Политика конфиденциальности</h3>
              <p className="settings-item-description">Как мы защищаем ваши данные</p>
            </div>
            <button className="settings-button secondary" onClick={() => setShowPrivacyModal(true)}>
              Открыть
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <h3 className="settings-item-title">Условия использования</h3>
              <p className="settings-item-description">Правила работы с приложением</p>
            </div>
            <button className="settings-button secondary" onClick={() => setShowTermsModal(true)}>
              Открыть
            </button>
          </div>
        </div>
      </div>

      {showPrivacyModal && (
        <div className="settings-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Политика конфиденциальности</h2>
              <button className="settings-modal-close" onClick={() => setShowPrivacyModal(false)}>
                ×
              </button>
            </div>
            <div className="settings-modal-body">
              <h3>1. Общие положения</h3>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты
                персональных данных пользователей приложения FinTrack.
              </p>

              <h3>2. Собираемые данные</h3>
              <p>Мы собираем следующие типы данных:</p>
              <ul>
                <li>Персональные данные: имя пользователя, email</li>
                <li>Финансовые данные: транзакции, категории, суммы</li>
                <li>Технические данные: IP-адрес, тип браузера, устройство</li>
              </ul>

              <h3>3. Использование данных</h3>
              <p>Собранные данные используются для:</p>
              <ul>
                <li>Предоставления функционала приложения</li>
                <li>Улучшения качества сервиса</li>
                <li>Обеспечения безопасности</li>
              </ul>

              <h3>4. Защита данных</h3>
              <p>
                Мы применяем современные методы защиты данных, включая шифрование и безопасное
                хранение информации.
              </p>

              <h3>5. Права пользователей</h3>
              <p>Вы имеете право:</p>
              <ul>
                <li>Получать доступ к своим данным</li>
                <li>Исправлять неточные данные</li>
                <li>Удалять свои данные</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>

              <h3>6. Контакты</h3>
              <p>По вопросам конфиденциальности обращайтесь: support@fintrack.ru</p>

              <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="settings-modal-footer">
              <button
                className="settings-button primary"
                onClick={() => setShowPrivacyModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div className="settings-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Условия использования</h2>
              <button className="settings-modal-close" onClick={() => setShowTermsModal(false)}>
                ×
              </button>
            </div>
            <div className="settings-modal-body">
              <h3>1. Принятие условий</h3>
              <p>
                Используя приложение FinTrack, вы соглашаетесь с настоящими Условиями использования.
              </p>

              <h3>2. Использование сервиса</h3>
              <p>Вы обязуетесь:</p>
              <ul>
                <li>Использовать приложение только в законных целях</li>
                <li>Не нарушать права других пользователей</li>
                <li>Не пытаться получить несанкционированный доступ к системе</li>
                <li>Предоставлять достоверную информацию</li>
              </ul>

              <h3>3. Интеллектуальная собственность</h3>
              <p>
                Все материалы приложения, включая дизайн, код и контент, защищены авторским правом.
              </p>

              <h3>4. Ответственность</h3>
              <p>
                Приложение предоставляется &quot;как есть&quot;. Мы не гарантируем бесперебойную
                работу сервиса и не несем ответственности за возможные потери данных.
              </p>

              <h3>5. Изменения условий</h3>
              <p>
                Мы оставляем за собой право изменять настоящие Условия использования в любое время.
                Продолжение использования сервиса означает согласие с новыми условиями.
              </p>

              <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="settings-modal-footer">
              <button className="settings-button primary" onClick={() => setShowTermsModal(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
