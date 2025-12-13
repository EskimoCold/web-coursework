import { useState, useRef } from 'react';
import './settings.css';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { transactionsApi, Transaction, Category } from '../api/transactions';
import { categoriesApi } from '../api/categories';

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

interface ExportData {
  transactions: Transaction[];
  categories: Category[];
  exportDate: string;
  version: string;
}

function DataManagementSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setImportMessage(null);

      // Получаем все данные
      const [transactions, categories] = await Promise.all([
        transactionsApi.getTransactions(),
        categoriesApi.getCategories(),
      ]);

      // Формируем объект для экспорта
      const exportData: ExportData = {
        transactions,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      // Создаем JSON строку
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();

      // Очищаем
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportMessage({ type: 'success', text: 'Данные успешно экспортированы' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setImportMessage({ type: 'error', text: `Ошибка экспорта: ${errorMessage}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportMessage(null);

      // Читаем файл
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Валидация структуры данных
      if (!importData.transactions || !importData.categories) {
        throw new Error('Неверный формат файла. Ожидается объект с полями transactions и categories.');
      }

      if (!Array.isArray(importData.transactions) || !Array.isArray(importData.categories)) {
        throw new Error('Неверный формат данных. Поля transactions и categories должны быть массивами.');
      }

      // Импортируем категории (сначала категории, так как транзакции могут ссылаться на них)
      const categoryMap = new Map<number, number>(); // старое ID -> новое ID
      let importedCategories = 0;
      let importedTransactions = 0;
      let skippedCategories = 0;
      let skippedTransactions = 0;

      for (const category of importData.categories) {
        try {
          // Проверяем, существует ли категория с таким именем
          const existingCategories = await categoriesApi.getCategories();
          const existing = existingCategories.find((c: Category) => c.name === category.name);

          if (existing) {
            // Используем существующую категорию
            categoryMap.set(category.id, existing.id);
            skippedCategories++;
          } else {
            // Создаем новую категорию
            const newCategory = await categoriesApi.addCategory(
              category.name,
              category.description || '',
            );
            categoryMap.set(category.id, newCategory.id);
            importedCategories++;
          }
        } catch (error) {
          console.error(`Ошибка импорта категории ${category.name}:`, error);
          skippedCategories++;
        }
      }

      // Импортируем транзакции
      for (const transaction of importData.transactions) {
        try {
          // Валидация транзакции
          if (
            !transaction.amount ||
            !transaction.transaction_type ||
            !transaction.transaction_date ||
            !transaction.description
          ) {
            skippedTransactions++;
            continue;
          }

          // Преобразуем category_id если есть
          let newCategoryId: number | null = null;
          if (transaction.category_id && categoryMap.has(transaction.category_id)) {
            newCategoryId = categoryMap.get(transaction.category_id)!;
          }

          // Создаем транзакцию
          await transactionsApi.createTransaction({
            amount: transaction.amount,
            description: transaction.description,
            transaction_type: transaction.transaction_type,
            category_id: newCategoryId,
            transaction_date: transaction.transaction_date,
          });

          importedTransactions++;
        } catch (error) {
          console.error(`Ошибка импорта транзакции:`, error);
          skippedTransactions++;
        }
      }

      // Формируем сообщение о результате
      const messages = [];
      if (importedCategories > 0) messages.push(`Импортировано категорий: ${importedCategories}`);
      if (importedTransactions > 0) messages.push(`Импортировано транзакций: ${importedTransactions}`);
      if (skippedCategories > 0) messages.push(`Пропущено категорий: ${skippedCategories}`);
      if (skippedTransactions > 0) messages.push(`Пропущено транзакций: ${skippedTransactions}`);

      if (importedCategories === 0 && importedTransactions === 0) {
        setImportMessage({
          type: 'error',
          text: 'Не удалось импортировать данные. Проверьте формат файла.',
        });
      } else {
        setImportMessage({
          type: 'success',
          text: messages.join('. ') || 'Импорт завершен',
        });
      }

      // Очищаем input для возможности повторного выбора того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setImportMessage({ type: 'error', text: `Ошибка импорта: ${errorMessage}` });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Управление данными</h2>
      <p className="settings-section-description">Экспорт, импорт и резервное копирование</p>

      {importMessage && (
        <div
          className={`import-message ${importMessage.type === 'success' ? 'success' : 'error'}`}
          role="alert"
        >
          {importMessage.text}
        </div>
      )}

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
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            data-testid="import-file-input"
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

  const handleOpenPrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const handleClosePrivacyModal = () => {
    setShowPrivacyModal(false);
  };

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
            <button className="settings-button secondary">Написать</button>
          </div>

          <div className="settings-item">
            <div className="settings-item-content">
              <h3 className="settings-item-title">Политика конфиденциальности</h3>
              <p className="settings-item-description">Как мы защищаем ваши данные</p>
            </div>
            <button className="settings-button secondary" onClick={handleOpenPrivacyPolicy}>
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
      </div>

      {showPrivacyModal && (
        <div className="modal-overlay" onClick={handleClosePrivacyModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Политика конфиденциальности</h2>
              <button className="close-button" onClick={handleClosePrivacyModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <h3>1. Сбор информации</h3>
              <p>
                Мы собираем информацию, которую вы предоставляете при регистрации и использовании
                приложения, включая данные о транзакциях и категориях.
              </p>

              <h3>2. Использование информации</h3>
              <p>
                Ваши данные используются исключительно для предоставления функционала приложения и
                улучшения качества сервиса.
              </p>

              <h3>3. Защита данных</h3>
              <p>
                Мы применяем современные методы шифрования и защиты данных для обеспечения
                безопасности вашей информации.
              </p>

              <h3>4. Передача данных третьим лицам</h3>
              <p>
                Мы не передаем ваши персональные данные третьим лицам без вашего явного согласия,
                за исключением случаев, предусмотренных законодательством.
              </p>

              <h3>5. Ваши права</h3>
              <p>
                Вы имеете право на доступ, исправление и удаление ваших персональных данных в любой
                момент.
              </p>

              <h3>6. Изменения в политике</h3>
              <p>
                Мы оставляем за собой право вносить изменения в настоящую политику
                конфиденциальности. О существенных изменениях мы уведомим вас через приложение.
              </p>

              <p className="modal-footer-text">
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="modal-actions">
              <button className="settings-button primary" onClick={handleClosePrivacyModal}>
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
