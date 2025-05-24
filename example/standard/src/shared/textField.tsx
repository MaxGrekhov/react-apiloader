import { type ChangeEvent, type FC, useCallback, useMemo, type KeyboardEvent, useId } from 'react';

export interface TextFieldProps {
  readonly value?: string;
  readonly label?: string;
  readonly name?: string;
  readonly onChange?: (v: string) => void;
  readonly onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  readonly onEnter?: () => void;
  readonly type?: 'text' | 'password';
}

export const TextField: FC<TextFieldProps> = ({
  value,
  label,
  name,
  type,
  onChange,
  onKeyDown,
  onEnter,
}) => {
  const id = useId();
  const onchange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
    [onChange],
  );
  const onkeydown = useMemo(
    () =>
      onKeyDown || onEnter
        ? (e: KeyboardEvent<HTMLInputElement>) => {
            if (onKeyDown) onKeyDown(e);
            if (e.key === 'Enter' && onEnter) onEnter();
          }
        : undefined,
    [onEnter, onKeyDown],
  );
  return (
    <div className="flex flex-col w-full max-w-md mb-4">
      {label && (
        <label
          className="mb-1 text-sm font-medium text-gray-700"
          htmlFor={name ?? 'textfield-' + id}>
          {label}
        </label>
      )}
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        type={type ?? 'text'}
        id={name ?? 'textfield-' + id}
        value={value}
        onChange={onchange}
        onKeyDown={onkeydown}
        placeholder={label ? `Enter ${label.toLowerCase()}...` : undefined}
      />
    </div>
  );
};

