import React from 'react';

export interface GridProps {
  readonly className?: string;
  readonly children?: React.ReactNode;
  readonly mode?: 'template' | 'auto' | 'autosmall';
  readonly columns?: string;
}

export const Grid: React.FC<GridProps> = ({ children, mode, columns, className }) => {
  let cols;
  switch (mode) {
    case 'template':
      cols = columns?.replace(' ', '_') ?? '1fr';
      break;
    case 'auto':
      cols = 'repeat(auto-fit,minmax(300px,1fr))';
      break;
    case 'autosmall':
      cols = 'repeat(auto-fit,minmax(150px,1fr))';
      break;
    default:
      cols = '1fr';
      break;
  }
  return <div className={`grid gap-2 grid-cols-[${cols}] ${className}`}>{children}</div>;
};

