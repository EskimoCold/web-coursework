import './sidebar.css';
import { useAuth } from '../contexts/AuthContext';

import { Icon } from './Icon';

type Props = {
  active: string; // ← semicolons, not commas
  onSelect: (label: string) => void;
};

const NAV: { label: string; icon: string }[] = [
  { label: 'Главная', icon: 'home.svg' },
  { label: 'Аналитика', icon: 'analytics.svg' },
  { label: 'Категории', icon: 'categories.svg' },
  { label: 'Настройки', icon: 'settings.svg' },
];

const srcIconPref = 'icons/sidebar/';

export function Sidebar({ active, onSelect }: Props) {
  const { user, logout } = useAuth();

  return (
    <nav className="sb" aria-label="sidebar">
      <div className="sb-brand">
        <span className="sb-brand-dot" aria-hidden />
        <span className="sb-brand-name">FinTrack</span>
      </div>

      <div className="sb-user">
        <Icon source={`${srcIconPref}user.svg`} size={30} style={{ borderRadius: 30 }} />
        <span className="sb-user-name">{user?.username || 'Пользователь'}</span>
      </div>

      <ul className="sb-list" role="list">
        {NAV.map(({ label, icon }) => {
          const isActive = label === active;
          return (
            <li key={label} className="sb-li">
              <button
                className={`sb-item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(label)}
              >
                <span className="sb-active-bar" aria-hidden />
                <Icon source={srcIconPref + icon} size={15} />
                <span className="sb-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sb-spacer" />

      <button className="sb-exit" aria-label="Выход" onClick={logout}>
        <Icon source={`${srcIconPref}exit.svg`} size={15} />
        <span className="sb-label">Выход</span>
      </button>
    </nav>
  );
}
