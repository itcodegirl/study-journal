import { Menu, NotebookPen } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { IconButton } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { CourseSidebar } from '../features/courses/CourseSidebar';
import { MEDIA_QUERIES, useMediaQuery } from '../hooks/useMediaQuery';

function Brand() {
  return (
    <div className="brand">
      <NotebookPen aria-hidden="true" className="brand__icon" />
      <span className="brand__name">Study Journal</span>
    </div>
  );
}

/**
 * Shell around the notebook. With room for three columns the course list is a
 * fixed sidebar; on narrower screens it moves behind a menu button so the
 * notebook keeps the width.
 */
export function AppShell() {
  const inlineLayout = useMediaQuery(MEDIA_QUERIES.inlineLayout);
  const [navOpen, setNavOpen] = useState(false);
  const navDrawerOpen = !inlineLayout && navOpen;

  return (
    <div className="app-shell" data-layout={inlineLayout ? 'inline' : 'stacked'}>
      <a href="#main" className="skip-link">
        Skip to notebook
      </a>
      {inlineLayout ? (
        <aside className="app-sidebar">
          <Brand />
          <CourseSidebar />
          <p className="app-sidebar__note">Your writing saves to this browser.</p>
        </aside>
      ) : (
        <header className="app-topbar">
          <IconButton label="Open course navigation" onClick={() => setNavOpen(true)}>
            <Menu aria-hidden="true" />
          </IconButton>
          <Brand />
        </header>
      )}
      <main id="main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      {navDrawerOpen && (
        <Drawer title="Courses" side="left" onClose={() => setNavOpen(false)}>
          <CourseSidebar onNavigate={() => setNavOpen(false)} />
        </Drawer>
      )}
    </div>
  );
}
