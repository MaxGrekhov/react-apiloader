import { createContext, useContext } from 'react';

import {
  ApiCallResult,
  IHttpClientFactory,
  LoaderState,
  LoaderStateSetter,
  ModifyValue,
} from './types';

export const LoaderStateContext = createContext<LoaderState | undefined>(undefined);

export const LoaderStateSetterContext = createContext<LoaderStateSetter | undefined>(undefined);

export const HttpClientFactoryContext = createContext<IHttpClientFactory | undefined>(undefined);

export const HttpInterceptorHookContext = createContext<
  (<TState>() => ModifyValue<ApiCallResult<TState>>) | undefined
>(undefined);

export const useLoaderState = (): LoaderState => {
  const context = useContext(LoaderStateContext);
  if (context == null)
    throw new Error('You should add <LoaderStateContext.Provider> as the root component');
  return context;
};

export const useLoaderStateSetter = (): LoaderStateSetter => {
  const context = useContext(LoaderStateSetterContext);
  if (context == null)
    throw new Error('You should add <LoaderStateSetterContext.Provider> as the root component');
  return context;
};

export const useHttpClientFactory = (): IHttpClientFactory => {
  const httpClientFactory = useContext(HttpClientFactoryContext);
  if (httpClientFactory == null)
    throw new Error('You should add <HttpClientFactoryContext.Provider> as the root component');
  return httpClientFactory;
};

export const useHttpInterceptor = <TState>(): ModifyValue<ApiCallResult<TState>> | undefined =>
  useContext(HttpInterceptorHookContext)?.<TState>();
