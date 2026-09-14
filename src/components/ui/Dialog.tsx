import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cx } from '../../lib/classNames';
import { IconButton } from './Button';

interface DialogProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  /**
   * 'sheet' fills a phone screen and moves actions into the header, where the
   * on-screen keyboard cannot cover them.
   */
  variant?: 'dialog' | 'sheet';
  actions?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}

/**
 * Modal dialog portaled to <body> so no contained or transformed ancestor can
 * trap it. Backdrop clicks deliberately do nothing: dialogs here hold learner
 * input, so closing takes Escape, Cancel, or the close button.
 */
export function Dialog({ title, icon, onClose, variant = 'dialog', actions, initialFocusRef, className, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, { enabled: true, onEscape: onClose });

  useEffect(() => {
    initialFocusRef?.current?.focus();
  }, [initialFocusRef]);

  return createPortal(
    <div className="overlay overlay--dialog" data-variant={variant}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('dialog', `dialog--${variant}`, className)}
      >
        <header className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {icon}
            {title}
          </h2>
          {variant === 'sheet' ? (
            <div className="dialog__header-actions">{actions}</div>
          ) : (
            <IconButton label="Close" onClick={onClose}>
              <X aria-hidden="true" />
            </IconButton>
          )}
        </header>
        <div className="dialog__body">{children}</div>
        {variant === 'dialog' && actions ? <footer className="dialog__footer">{actions}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
