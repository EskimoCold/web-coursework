import React, { useState } from 'react';
import './settings.css';
import { useCurrency } from '../contexts/CurrencyContext';
import type { Currency } from '../utils/currency';

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

  const handlePrivacyClick = () => {
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
            <button className="settings-button secondary" onClick={handlePrivacyClick}>
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
            <div className="modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
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
              <p>
                По вопросам конфиденциальности обращайтесь: support@fintrack.ru
              </p>

              <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #eee' }}>
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
