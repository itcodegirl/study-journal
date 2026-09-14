import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../lib/classNames';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx('button', `button--${variant}`, `button--${size}`, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Accessible name; also shown as a tooltip. */
  label: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ label, className, children, type = 'button', title, ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx('icon-button', className)} aria-label={label} title={title ?? label} {...rest}>
      {children}
    </button>
  );
}
