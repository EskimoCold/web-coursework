import './settings.css';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="settings-modal">
      <div className="settings-modal-bg" onClick={onClose} />
      <div
        className="settings-modal-content"
        style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 className="settings-section-title" style={{ fontSize: '20px', margin: 0 }}>
            Политика конфиденциальности
          </h3>
          <button
            className="settings-button"
            onClick={onClose}
            style={{ padding: '4px 12px', fontSize: '18px', lineHeight: '1' }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>
          <h4
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px', fontWeight: 600 }}
          >
            1. Сбор информации
          </h4>
          <p>
            Мы собираем только необходимую информацию для предоставления услуг финансового учета:
            данные о транзакциях, категориях расходов и доходах. Мы не собираем персональные данные
            без вашего согласия.
          </p>

          <h4
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px', fontWeight: 600 }}
          >
            2. Использование данных
          </h4>
          <p>
            Все ваши данные хранятся в зашифрованном виде и используются исключительно для
            функционирования приложения. Мы не передаем ваши данные третьим лицам без вашего
            согласия.
          </p>

          <h4
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px', fontWeight: 600 }}
          >
            3. Защита данных
          </h4>
          <p>
            Мы используем современные методы шифрования и защиты данных. Все соединения защищены
            протоколом HTTPS. Ваши пароли хранятся в зашифрованном виде и не могут быть
            восстановлены даже администраторами системы.
          </p>

          <h4
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px', fontWeight: 600 }}
          >
            4. Права пользователя
          </h4>
          <p>
            Вы имеете право в любой момент запросить экспорт ваших данных, изменить или удалить их.
            Вы можете удалить свой аккаунт в настройках приложения, что приведет к безвозвратному
            удалению всех ваших данных.
          </p>

          <h4
            style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px', fontWeight: 600 }}
          >
            5. Изменения в политике
          </h4>
          <p>
            Мы оставляем за собой право вносить изменения в данную политику конфиденциальности. О
            существенных изменениях мы уведомим пользователей через приложение.
          </p>

          <p style={{ marginTop: '30px', fontSize: '12px', color: '#6b7280' }}>
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="settings-form-actions" style={{ marginTop: '24px' }}>
          <button type="button" className="settings-button primary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
