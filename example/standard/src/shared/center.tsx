import type { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export const Center: FC<Props> = ({ children, className }) => {
  return (
    <div className={`flex justify-center items-center w-full gap-1 ${className}`}>
      {children}
    </div>
  );
};

