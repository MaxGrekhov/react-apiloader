import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';

import { useLoaderInfo, type AppKey } from './loader';

export const useMessages = (id: AppKey = 'none', mode?: AppKey) => {
  const info = useLoaderInfo(id, mode);
  const [messages, setMessages] = useState<React.ReactNode[]>([]);

  const set = useCallback((value?: string | string[] | ZodError | Error) => {
    if (value == null) setMessages([]);
    else {
      const strings =
        value instanceof ZodError
          ? value.errors.map((x) => x.message)
          : value instanceof Error
            ? value.message
            : value;
      const messages = Array.isArray(strings) ? strings : [strings];
      setMessages(messages);
    }
  }, []);
  const isMount = useRef(true);
  useEffect(() => {
    if (isMount.current) {
      isMount.current = false;
      return;
    }
    let messages: React.ReactNode[] = [];
    if (info?.isError && info.error.description) {
      messages = Array.isArray(info.error.description)
        ? info.error.description
        : [info.error.description];
    }
    setMessages(messages);
  }, [info]);

  const content = messages.length > 0 && (
    <div className="break-all text-red-500">
      {messages.map((x, i) => (
        <div key={i}>{x}</div>
      ))}
    </div>
  );

  return [content, set] as const;
};
