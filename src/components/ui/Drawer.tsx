import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cx } from '../../lib/classNames';
import { IconButton } from './Button';

interface DrawerProps {
  title: string;
  side: 'left' | 'right' | 'bottom';
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/** Slide-over navigation or study context for tablet and phone layouts. */
export function Drawer({ title, side, onClose, className, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, { enabled: true, onEscape: onClose });

  return createPortal(
    <div
      className="overlay overlay--drawer"
      data-side={side}
      onClick={(event) => {
        // Drawers hold navigation and lists, not unsaved input, so the backdrop closes them.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('drawer', `drawer--${side}`, className)}
      >
        <header className="drawer__header">
          <h2 id={titleId} className="drawer__title">
            {title}
          </h2>
          <IconButton label={`Close ${title.toLowerCase()}`} onClick={onClose}>
            <X aria-hidden="true" />
          </IconButton>
        </header>
        <div className="drawer__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
