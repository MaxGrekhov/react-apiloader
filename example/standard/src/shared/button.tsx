import type { FC } from 'react';

export interface ButtonProps {
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly type?: 'button' | 'submit' | 'reset';
}

export const Button: FC<ButtonProps> = ({ children, ...other }) => {
  return (
    <button
      className="px-4 py-2 bg-blue-400 text-white font-medium rounded hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      {...other}>
      {children}
    </button>
  );
};
