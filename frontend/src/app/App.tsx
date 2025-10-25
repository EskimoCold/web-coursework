import { useState } from 'react';

import { Layout } from '../components/Layout';
import { SettingsPage } from '../components/SettingsPage';
import { Sidebar } from '../components/Sidebar';

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
