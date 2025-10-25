import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { SettingsPage } from '../components/SettingsPage';

export default function App() {
  const [active, setActive] = useState('Категории');

  const renderContent = () => {
    if (active === 'Настройки') {
      return <SettingsPage />;
    }

    return <div aria-label="content-placeholder" className="content-placeholder" />;
  };

  return (
    <div className="app-root">
      <Sidebar active={active} onSelect={setActive} />
      <Layout title={active}>{renderContent()}</Layout>
    </div>
  );
}
