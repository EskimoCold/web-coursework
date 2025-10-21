import { useState } from 'react';

// go up one level first:
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';

export default function App() {
  const [active, setActive] = useState('Категории');
  return (
    <div className="app-root">
      <Sidebar active={active} onSelect={setActive} />
      <Layout title={active}>
        <div aria-label="content-placeholder" className="content-placeholder" />
      </Layout>
    </div>
  );
}
