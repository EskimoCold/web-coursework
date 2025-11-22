import { useState, useRef } from 'react';

import { transactionsApi, TransactionCreate } from '../api/transactions';
import { useCurrency } from '../contexts/CurrencyContext';
import './settings.css';

type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'CNY';

// Добавляем интерфейс для пропсов PrivacyPolicyModal
interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Политика конфиденциальности</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <h3>1. Сбор информации</h3>
          <p>
            Мы собираем информацию, которую вы предоставляете при использовании нашего приложения,
            включая данные о ваших финансовых операциях, категориях расходов, доходах и финансовых
            целях. Также мы можем автоматически собирать техническую информацию о вашем устройстве и
            использовании приложения для аналитики и улучшения сервиса.
          </p>

          <h3>2. Использование информации</h3>
          <p>
            Собранная информация используется для улучшения работы приложения, персонализации вашего
            опыта, предоставления точной финансовой аналитики и отчетности. Мы также используем
            данные для разработки новых функций, обеспечения безопасности вашего аккаунта и отправки
            важных уведомлений, связанных с работой приложения.
          </p>

          <h3>3. Защита данных</h3>
          <p>
            Мы принимаем меры для защиты ваших персональных данных, включая использование
            современных технологий шифрования, регулярное обновление систем безопасности и
            ограничение доступа к информации только для уполномоченных сотрудников. Ваши финансовые
            данные хранятся на защищенных серверах с многоуровневой системой аутентификации.
          </p>

          <h3>4. Передача данных третьим лицам</h3>
          <p>
            Мы не передаем ваши персональные данные третьим лицам, за исключением случаев,
            предусмотренных законодательством или необходимых для предоставления услуг (например,
            обработка платежей через проверенных партнеров). Во всех таких случаях мы обеспечиваем
            соответствие партнеров строгим стандартам защиты данных.
          </p>

          <h3>5. Ваши права</h3>
          <p>
            Вы имеете право на доступ к вашим персональным данным, их исправление, удаление или
            ограничение обработки. Вы можете в любой момент отозвать согласие на обработку данных,
            обратившись в нашу службу поддержки. Также вы можете экспортировать все ваши данные в
            удобном формате через соответствующий раздел настроек приложения.
          </p>

          <h3>6. Срок хранения данных</h3>
          <p>
            Мы храним ваши персональные данные в течение всего времени использования приложения и в
            течение 3 лет после последней активности, если иное не требуется по законодательству или
            для разрешения споров.
          </p>

          <h3>7. Контакты</h3>
          <p>
            По вопросам конфиденциальности и защиты данных обращайтесь: privacy@fintrack.ru. Мы
            обязуемся ответить на ваш запрос в течение 10 рабочих дней.
          </p>

          <p>
            <strong>Дата последнего обновления:</strong> 15 декабря 2023 года
          </p>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
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
          {/*<button className="settings-button primary">Сменить пароль</button>*/}
        </div>

        <div className="settings-item danger">
          <div className="settings-item-content">
            <h3 className="settings-item-title">Удаление аккаунта</h3>
            <p className="settings-item-description">Безвозвратное удаление всех данных</p>
          </div>
          <button className="settings-button danger">Удалить аккаунт</button>
        </div>
      </div>
    </div>
  );
}

function DataManagementSection() {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    setExportLoading(true);
    setExportMessage(null);

    try {
      // Получаем все транзакции
      const transactions = await transactionsApi.getTransactions();

      const exportData = {
        exportDate: new Date().toISOString(),
        transactions: transactions,
        summary: {
          totalTransactions: transactions.length,
          totalIncome: transactions
            .filter((t) => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: transactions
            .filter((t) => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
          balance:
            transactions
              .filter((t) => t.transaction_type === 'income')
              .reduce((sum, t) => sum + t.amount, 0) -
            transactions
              .filter((t) => t.transaction_type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0),
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `fin-track-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setExportMessage('Данные успешно экспортированы в JSON!');
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('Ошибка при экспорте данных');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportMessage(null);

    try {
      const fileContent = await readFileAsText(file);
      const importData = JSON.parse(fileContent);

      // Проверяем структуру файла
      if (!importData.transactions || !Array.isArray(importData.transactions)) {
        throw new Error('Неверный формат файла. Ожидается файл экспорта FinTrack.');
      }

      let importedCount = 0;
      let errors = 0;

      // Импортируем каждую транзакцию
      for (const transactionData of importData.transactions) {
        try {
          const transactionCreate: TransactionCreate = {
            amount: transactionData.amount,
            description: transactionData.description,
            transaction_type: transactionData.transaction_type,
            category_id: transactionData.category_id || null,
            transaction_date: transactionData.transaction_date,
          };

          await transactionsApi.createTransaction(transactionCreate);
          importedCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          errors++;
        }
      }

      if (errors > 0) {
        setImportMessage(`Импорт завершен. Успешно: ${importedCount}, с ошибками: ${errors}`);
      } else {
        setImportMessage(`Успешно импортировано ${importedCount} транзакций!`);
      }

      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage(
        `Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    } finally {
      setImportLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Управление данными</h2>
      <p className="settings-section-description">Экспорт, импорт и резервное копирование</p>

      <div className="settings-item">
        <div className="settings-item-content">
          <h3 className="settings-item-title">Экспорт данных</h3>
          <p className="settings-item-description">Выгрузить все данные в файл</p>
          {exportMessage && (
            <div
              className={`export-message ${exportMessage.includes('Ошибка') ? 'error' : 'success'}`}
            >
              {exportMessage}
            </div>
          )}
        </div>
        <div className="settings-button-group">
          <button
            className="settings-button secondary"
            onClick={handleExportJSON}
            disabled={exportLoading}
          >
            {exportLoading ? 'Экспорт...' : 'JSON'}
          </button>
        </div>
      </div>

      <div className="settings-item">
        <div className="settings-item-content">
          <h3 className="settings-item-title">Импорт данных</h3>
          <p className="settings-item-description">Загрузить данные из файла JSON</p>
          {importMessage && (
            <div
              className={`import-message ${importMessage.includes('Ошибка') ? 'error' : 'success'}`}
            >
              {importMessage}
            </div>
          )}
        </div>
        <div className="settings-button-group">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          <button
            className="settings-button primary"
            onClick={handleImportClick}
            disabled={importLoading}
          >
            {importLoading ? 'Импорт...' : 'Выбрать файл'}
          </button>
        </div>
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
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
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
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

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
            onClick={() => setIsPrivacyPolicyOpen(true)}
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
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
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
