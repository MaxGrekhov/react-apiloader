import type { FC } from 'react';

import { useLoaderInfo, type AppKey } from '@/core/loader';

import { Button, type ButtonProps } from './button';
import { Spinner } from './spinner';

export type LoadingButtonProps = ButtonProps & {
  actionType: AppKey;
  mode?: AppKey;
};

export const LoadingButton: FC<LoadingButtonProps> = ({
  actionType,
  mode = undefined,
  children,
  disabled,
  ...other
}) => {
  const item = useLoaderInfo(actionType, mode);
  const isDisabled = item?.isWaiting || disabled;
  return (
    <Button disabled={isDisabled} {...other}>
      {item?.isWaiting ? <Spinner /> : children}
    </Button>
  );
};
