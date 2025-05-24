import type { CSSProperties, FC, ReactNode } from 'react';

export interface PanelProps {
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export const Panel: FC<PanelProps> = ({ children, style, className }) => (
  <div className={`flex flex-wrap items-center gap-1 ${className}`} style={style}>
    {children}
  </div>
);
