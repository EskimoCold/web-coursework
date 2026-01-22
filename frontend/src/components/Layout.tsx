import { ReactNode, useMemo } from 'react';
import './layout.css';

type Props = { children: ReactNode };

export function Layout({ children }: Props) {
  const isMobile = useMemo(() => {
    const style = window.getComputedStyle(document.body);
    const base = Number(style.fontSize.replace('px', ''));
    const width = Number(style.width.replace('px', ''));
    const rem = width / base;
    return rem <= 48;
  }, []);

  return (
    <main className="layout" aria-label="main-layout">
      {!isMobile && (
        <>
          <section className="layout-content">{children}</section>
          <footer className="layout-footer">©2025 FinTrack</footer>
        </>
      )}
      {isMobile && children}
    </main>
  );
}
