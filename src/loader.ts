import { useCallback, useEffect } from 'react';

import { useHttpClientFactory, useLoaderState, useLoaderStateSetter } from './context';
import { AppKey, ApiCallResult, IHttpClient, IHttpClientError, LoaderData } from './types';

const okLoaderData = (id: AppKey, mode: AppKey): LoaderData => ({
  id,
  mode,
  isOk: true,
  isWaiting: false,
  isError: false,
});

const waitingLoaderData = (id: AppKey, mode: AppKey, cancel: () => void): LoaderData => ({
  id,
  mode,
  isOk: false,
  isWaiting: true,
  isError: false,
  cancel,
});

const errorLoaderData = (id: AppKey, mode: AppKey, error: IHttpClientError): LoaderData => ({
  id,
  mode,
  isOk: false,
  isWaiting: false,
  isError: true,
  error,
});

const successApiCallResult = <T>(data: T): ApiCallResult<T> => ({
  isSuccess: true,
  isCanceled: false,
  isError: false,
  data,
});

const canceledApiCallResult = <T>(): ApiCallResult<T> => ({
  isSuccess: false,
  isCanceled: true,
  isError: false,
});

const errorApiCallResult = <T>(error: IHttpClientError): ApiCallResult<T> => ({
  isSuccess: false,
  isCanceled: false,
  isError: true,
  error,
});

export const useLoader = (): (<TParams, TState>(
  id: AppKey,
  mode: AppKey,
  params: TParams,
  promiseFactory: (http: IHttpClient, params: TParams) => Promise<TState>,
) => Promise<ApiCallResult<TState>>) => {
  const updateLoader = useLoaderStateSetter();
  const httpClientFactory = useHttpClientFactory();
  return useCallback(
    <TParams, TState>(
      id: AppKey,
      mode: AppKey = '',
      params: TParams,
      promiseFactory: (http: IHttpClient, params: TParams) => Promise<TState>,
    ) => {
      const httpClient = httpClientFactory();
      updateLoader(waitingLoaderData(id, mode, httpClient.cancel.bind(httpClient)), true);
      return promiseFactory(httpClient, params)
        .then((data) => {
          updateLoader(okLoaderData(id, mode));
          return successApiCallResult(data);
        })
        .catch((error) => {
          if (httpClient.isCanceled(error)) return canceledApiCallResult<TState>();
          const httpClientError = httpClient.parseError(error);
          updateLoader(errorLoaderData(id, mode, httpClientError));
          return errorApiCallResult<TState>(httpClientError);
        });
    },
    [httpClientFactory, updateLoader],
  );
};

export const useLoaderInfo = (id: AppKey, mode: AppKey = ''): LoaderData | undefined =>
  useLoaderState().get(id)?.get(mode);

export const useCancelAction = (): ((id: AppKey, mode?: AppKey) => void) => {
  const updateLoader = useLoaderStateSetter();
  return useCallback(
    (id: AppKey, mode: AppKey = '') => updateLoader(okLoaderData(id, mode), true),
    [updateLoader],
  );
};

export const useCancellation = (id: AppKey, mode: AppKey = ''): void => {
  const cancel = useCancelAction();
  useEffect(() => {
    return () => cancel(id, mode);
  }, [cancel, id, mode]);
};
