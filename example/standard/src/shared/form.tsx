import { useCallback } from 'react';

import { Grid, type GridProps } from './grid';

export interface FormProps extends GridProps {
  className?: string;
  children?: React.ReactNode;
  onSubmit?: () => void;
}

export const Form: React.FC<FormProps> = ({ className, children, onSubmit, ...gridProps }) => {
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.();
    },
    [onSubmit],
  );
  return (
    <form className={className} onSubmit={handleSubmit}>
      <Grid {...gridProps}>{children}</Grid>
    </form>
  );
};

