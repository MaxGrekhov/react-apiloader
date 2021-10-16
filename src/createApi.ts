import { useCallback, useEffect, useRef, useState } from 'react';

import { useHttpInterceptor } from './context';
import { useCancelAction, useLoader } from './loader';
import { AppKey, ApiCallResult, IHttpClient, InitType, SetterType } from './types';

let hookId = 1;

export const createApiHook = <TState, TParams>(
  promiseFactory: (http: IHttpClient, params: TParams) => Promise<TState>,
) => {
  const id = hookId++ as AppKey;
  const useHook = (): ((params: TParams, mode?: AppKey) => Promise<ApiCallResult<TState>>) => {
    const loader = useLoader();
    const interceptor = useHttpInterceptor<TState>();
    const doApiCall = useCallback(
      (params: TParams, mode: AppKey = '') =>
        loader(id, mode, params, promiseFactory).then((apiCallResult) =>
          interceptor ? interceptor(apiCallResult) : apiCallResult,
        ),
      [interceptor, loader],
    );
    return doApiCall;
  };
  useHook.id = id;
  return useHook;
};

export const createApiHookWithState = <TState, TParams>(
  promiseFactory: (http: IHttpClient, params: TParams) => Promise<TState>,
  initValue: InitType<TState>,
) => {
  const apiHook = createApiHook(promiseFactory);
  const useHook = (): [
    Readonly<TState>,
    (params: TParams, mode?: AppKey) => Promise<ApiCallResult<TState>>,
    SetterType<Readonly<TState>>,
  ] => {
    // cancel, because we use local state
    const lastMode = useRef<AppKey>('');
    const cancel = useCancelAction();
    useEffect(() => () => cancel(apiHook.id, lastMode.current), [cancel]);
    // local state
    const [state, setState] = useState<TState>(initValue);
    // api
    const actionApi = apiHook();
    // create main callback
    const doApiCall = useCallback(
      (params: TParams, mode: AppKey = '') => {
        lastMode.current = mode;
        return actionApi(params, mode).then((apiCallResult) => {
          if (apiCallResult.isSuccess) setState(apiCallResult.data);
          return apiCallResult;
        });
      },
      [actionApi],
    );
    return [state, doApiCall, setState];
  };
  useHook.id = apiHook.id;
  return useHook;
};
