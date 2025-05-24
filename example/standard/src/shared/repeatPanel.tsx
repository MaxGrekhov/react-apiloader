import type { FC } from 'react';

import { useLoaderInfo, type AppKey } from '@/core/loader';
import { useMessages } from '@/core/useMessages';

import { Button } from './button';
import { Center } from './center';
import { Spinner } from './spinner';

interface Props {
  actionType: AppKey;
  mode?: AppKey;
  action: () => void;
  wrapper?: (x: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}

export const RepeatPanel: FC<Props> = ({ actionType, mode, action, children, wrapper }) => {
  const item = useLoaderInfo(actionType, mode);
  const [messages] = useMessages(actionType);

  if (item?.isWaiting) {
    const content = (
      <Center>
        <Spinner />
      </Center>
    );
    return wrapper ? wrapper(content) : content;
  }

  if (item?.isError) {    const content = (
      <Center>
        <div>Cannot get data from the server</div>
        <div>{messages}</div>
        <div>
          <Button onClick={action}>Try Again</Button>
        </div>
      </Center>
    );
    return wrapper ? wrapper(content) : content;
  }

  return <>{children}</>;
};
