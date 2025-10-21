import { ReactNode } from 'react';
import './layout.css';

type Props = { title: string; children: ReactNode };

export function Layout({ title, children }: Props) {
  return (
    <main className="layout" aria-label="main-layout">
      <header className="layout-header" role="banner">
        <h1 className="layout-title">{title}</h1>
      </header>
      <section className="layout-content">{children}</section>
      <footer className="layout-footer">©2025 FinTrack</footer>
    </main>
  );
}
