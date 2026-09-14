import { useId, type ReactNode, type Ref } from 'react';
import { cx } from '../../lib/classNames';

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean | undefined;
  hint?: ReactNode;
  error?: string | undefined;
  length?: number;
  maxLength?: number;
  children: ReactNode;
}

const COUNTER_THRESHOLD = 0.8;

function FieldShell({ id, label, required, hint, error, length, maxLength, children }: FieldShellProps) {
  const showCounter = maxLength !== undefined && length !== undefined && length >= maxLength * COUNTER_THRESHOLD;
  return (
    <div className={cx('field', error && 'field--invalid')}>
      <div className="field__label-row">
        <label htmlFor={id} className="field__label">
          {label}
          {!required && <span className="field__optional"> (optional)</span>}
        </label>
        {showCounter && (
          <span className="field__counter" aria-live="polite">
            {length}/{maxLength}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint: ReactNode, error: string | undefined): string | undefined {
  const ids = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ');
  return ids || undefined;
}

interface BaseFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  maxLength?: number;
  placeholder?: string;
}

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number;
  ref?: Ref<HTMLTextAreaElement>;
}

export function TextAreaField({ label, value, onChange, required, hint, error, maxLength, placeholder, rows = 3, ref }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} length={value.length} {...(maxLength ? { maxLength } : {})}>
      <textarea
        ref={ref}
        id={id}
        className="field__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}

interface TextInputFieldProps extends BaseFieldProps {
  list?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextInputField({ label, value, onChange, required, hint, error, maxLength, placeholder, list, ref }: TextInputFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} length={value.length} {...(maxLength ? { maxLength } : {})}>
      <input
        ref={ref}
        id={id}
        type="text"
        className="field__control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        list={list}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      />
    </FieldShell>
  );
}
