import React, { useCallback, useState } from 'react';

import {
  HttpClientFactoryContext,
  HttpInterceptorHookContext,
  LoaderStateContext,
  LoaderStateSetterContext,
} from './context';
import {
  AppKey,
  ApiCallResult,
  IHttpClientFactory,
  LoaderData,
  LoaderState,
  ModifyValue,
} from './types';

export interface LoaderContextProviderProps {
  httpInterceptorHook?: <TState>() => ModifyValue<ApiCallResult<TState>>;
  httpClientFactory: IHttpClientFactory;
}

export const LoaderContextProvider: React.FC<LoaderContextProviderProps> = ({
  children,
  httpInterceptorHook,
  httpClientFactory,
}) => {
  const [loaderState, setLoaderState] = useState<LoaderState>(
    new Map<string, Map<AppKey, LoaderData>>(),
  );
  const updateLoader = useCallback((item: LoaderData, shouldCancelCurrent = false) => {
    setLoaderState((state) => {
      const newState = new Map(state);
      const oldSubState = newState.get(item.id);
      const newSubState =
        oldSubState != null ? new Map(oldSubState) : new Map<AppKey, LoaderData>();
      if (shouldCancelCurrent) {
        const oldItem = newSubState.get(item.mode);
        if (oldItem?.isWaiting) oldItem.cancel();
      }
      return newState.set(item.id, newSubState.set(item.mode, item));
    });
  }, []);
  return (
    <HttpClientFactoryContext.Provider value={httpClientFactory}>
      <HttpInterceptorHookContext.Provider value={httpInterceptorHook}>
        <LoaderStateSetterContext.Provider value={updateLoader}>
          <LoaderStateContext.Provider value={loaderState}>{children}</LoaderStateContext.Provider>
        </LoaderStateSetterContext.Provider>
      </HttpInterceptorHookContext.Provider>
    </HttpClientFactoryContext.Provider>
  );
};
