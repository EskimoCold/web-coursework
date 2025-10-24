// src/components/SettingsPage.tsx
import { useState } from 'react';
import './settings.css';

// Секция безопасности
function SecuritySection() {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

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
                    <button className="settings-button primary">Сменить пароль</button>
                </div>

                <div className="settings-item">
                    <div className="settings-item-content">
                        <h3 className="settings-item-title">Двухфакторная аутентификация</h3>
                        <p className="settings-item-description">Дополнительная защита вашего аккаунта</p>
                    </div>
                    <label className="settings-toggle">
                        <input
                            type="checkbox"
                            checked={is2FAEnabled}
                            onChange={(e) => setIs2FAEnabled(e.target.checked)}
                        />
                        <span className="settings-toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-item">
                    <div className="settings-item-content">
                        <h3 className="settings-item-title">Подключенные сервисы</h3>
                        <p className="settings-item-description">Google, GitHub, Yandex</p>
                    </div>
                    <button className="settings-button secondary">Управлять</button>
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

// Секция управления данными
function DataManagementSection() {
    const [autoBackup, setAutoBackup] = useState(true);

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Управление данными</h2>
            <p className="settings-section-description">Экспорт, импорт и резервное копирование</p>

            <div className="settings-items">
                <div className="settings-item">
                    <div className="settings-item-content">
                        <h3 className="settings-item-title">Автоматическое резервирование</h3>
                        <p className="settings-item-description">Создание резервных копий данных</p>
                    </div>
                    <label className="settings-toggle">
                        <input
                            type="checkbox"
                            checked={autoBackup}
                            onChange={(e) => setAutoBackup(e.target.checked)}
                        />
                        <span className="settings-toggle-slider"></span>
                    </label>
                </div>

                <div className="settings-item">
                    <div className="settings-item-content">
                        <h3 className="settings-item-title">Экспорт данных</h3>
                        <p className="settings-item-description">Выгрузить все данные в файл</p>
                    </div>
                    <div className="settings-button-group">
                        <button className="settings-button secondary">JSON</button>
                        <button className="settings-button secondary">CSV</button>
                        <button className="settings-button secondary">PDF</button>
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
        </div>
    );
}

// Секция внешнего вида
function AppearanceSection() {
    const [theme, setTheme] = useState('light');
    const [currency, setCurrency] = useState('RUB');
    const [language, setLanguage] = useState('ru');

    return (
        <div className="settings-section">
            <h2 className="settings-section-title">Внешний вид</h2>
            <p className="settings-section-description">Тема, язык и валюта</p>

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

                <div className="settings-item">
                    <div className="settings-item-content">
                        <h3 className="settings-item-title">Язык интерфейса</h3>
                        <p className="settings-item-description">Язык меню и элементов управления</p>
                    </div>
                    <select
                        className="settings-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// Секция "О приложении"
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
        { id: 'security' as Section, label: 'Безопасность', description: 'Настройки входа и защиты данных' },
        { id: 'data' as Section, label: 'Управление данными', description: 'Экспорт, импорт и резервное копирование' },
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