import './sidebar.css';

type Props = {
  active: string; // ← semicolons, not commas
  onSelect: (label: string) => void;
};

const NAV: string[] = ['Главная', 'Аналитика', 'Категории', 'Настройки'];

export function Sidebar({ active, onSelect }: Props) {
  return (
    <nav className="sb" aria-label="sidebar">
      <div className="sb-brand">
        <span className="sb-brand-dot" aria-hidden />
        <span className="sb-brand-name">FinTrack</span>
      </div>

      <div className="sb-user">
        <span className="sb-avatar" aria-hidden />
        <span className="sb-user-name">Пользователь</span>
      </div>

      <ul className="sb-list" role="list">
        {NAV.map((label) => {
          const isActive = label === active;
          return (
            <li key={label} className="sb-li">
              <button
                className={`sb-item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelect(label)}
              >
                <span className="sb-active-bar" aria-hidden />
                <span className="sb-dot" aria-hidden />
                <span className="sb-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sb-spacer" />

      <button className="sb-exit" aria-label="Выход">
        <span className="sb-dot" aria-hidden />
        <span className="sb-label">Выход</span>
      </button>
    </nav>
  );
}
