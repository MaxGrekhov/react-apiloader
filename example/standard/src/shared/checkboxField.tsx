import { type ChangeEvent, type FC, useCallback, useId } from 'react';

export interface CheckboxFieldProps {
  readonly checked?: boolean;
  readonly label: string;
  readonly name?: string;
  readonly onChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
}

export const CheckboxField: FC<CheckboxFieldProps> = ({
  checked,
  label,
  name,
  onChange,
  disabled,
}) => {
  const id = useId();
  const onchange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked),
    [onChange],
  );

  return (
    <div className="flex items-center w-full max-w-md mb-4">
      <input
        className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-300 focus:ring-offset-0 focus:outline-none"
        type="checkbox"
        id={name ?? 'checkbox-' + id}
        checked={checked}
        onChange={onchange}
        disabled={disabled}
      />
      <label
        className="ml-2 text-sm font-medium text-gray-700"
        htmlFor={name ?? 'checkbox-' + id}>
        {label}
      </label>
    </div>
  );
};