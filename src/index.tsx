import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type AppKey = string | number;

export interface LoaderContextProviderProps<TClient, TError> {
  clientInterceptorHook?: ClientInterceptorHook<TError>;
  clientFactory: ClientFactory<TClient, TError>;
}

export type ClientAdapter<TError> = {
  cancel(): void;
  isCanceled(error: unknown): boolean;
  parseError(error: unknown): TError;
};

export type ClientInterceptorHook<TError> =
  | (() => <TState>(value: ApiCallResult<TState, TError>) => ApiCallResult<TState, TError>)
  | undefined;

export type ClientFactory<TClient, TError> = () => [TClient, ClientAdapter<TError>];

export type LoaderState<TError> = Map<AppKey, Map<AppKey, LoaderData<TError>>>;

export type LoaderStateSetter<TError> = (
  item: LoaderData<TError>,
  shouldCancelCurrent?: boolean,
) => void;

export type LoaderData<TError> = {
  readonly id: AppKey;
  readonly mode: AppKey;
} & (
  | { readonly isOk: true; readonly isWaiting: false; readonly isError: false }
  | {
      readonly isOk: false;
      readonly isWaiting: true;
      readonly isError: false;
      readonly cancel: () => void;
    }
  | {
      readonly isOk: false;
      readonly isWaiting: false;
      readonly isError: true;
      readonly error: TError;
    }
);

export type ApiCallResult<TState, TError> =
  | {
      readonly isSuccess: true;
      readonly isCanceled: false;
      readonly isError: false;
      readonly data: TState;
    }
  | {
      readonly isSuccess: false;
      readonly isCanceled: true;
      readonly isError: false;
    }
  | {
      readonly isSuccess: false;
      readonly isCanceled: false;
      readonly isError: true;
      readonly error: TError;
    };

let hookId = 1;

export const createLoaderApi = <TClient, TError>() => {
  type PromiseFactory<TState, TParams> = (client: TClient, params: TParams) => Promise<TState>;

  const LoaderStateContext = createContext<LoaderState<TError> | undefined>(undefined);

  const LoaderStateSetterContext = createContext<LoaderStateSetter<TError> | undefined>(undefined);

  const ClientFactoryContext = createContext<ClientFactory<TClient, TError> | undefined>(undefined);

  const ClientInterceptorHookContext = createContext<ClientInterceptorHook<TError>>(undefined);

  const useLoaderState = (): LoaderState<TError> => {
    const context = useContext(LoaderStateContext);
    if (context == null)
      throw new Error('You should add <LoaderStateContext.Provider> as the root component');
    return context;
  };

  const useLoaderStateSetter = (): LoaderStateSetter<TError> => {
    const context = useContext(LoaderStateSetterContext);
    if (context == null)
      throw new Error('You should add <LoaderStateSetterContext.Provider> as the root component');
    return context;
  };

  const useClientFactory = (): ClientFactory<TClient, TError> => {
    const clientFactory = useContext(ClientFactoryContext);
    if (clientFactory == null)
      throw new Error('You should add <ClientFactoryContext.Provider> as the root component');
    return clientFactory;
  };

  const useClientInterceptor = () => useContext(ClientInterceptorHookContext)?.();

  const okLoaderData = (id: AppKey, mode: AppKey): LoaderData<never> => ({
    id,
    mode,
    isOk: true,
    isWaiting: false,
    isError: false,
  });

  const waitingLoaderData = (id: AppKey, mode: AppKey, cancel: () => void): LoaderData<never> => ({
    id,
    mode,
    isOk: false,
    isWaiting: true,
    isError: false,
    cancel,
  });

  const errorLoaderData = (id: AppKey, mode: AppKey, error: TError): LoaderData<TError> => ({
    id,
    mode,
    isOk: false,
    isWaiting: false,
    isError: true,
    error,
  });

  const successApiCallResult = <T,>(data: T): ApiCallResult<T, never> => ({
    isSuccess: true,
    isCanceled: false,
    isError: false,
    data,
  });

  const canceledApiCallResult = <T,>(): ApiCallResult<T, never> => ({
    isSuccess: false,
    isCanceled: true,
    isError: false,
  });

  const errorApiCallResult = <T, TError>(error: TError): ApiCallResult<T, TError> => ({
    isSuccess: false,
    isCanceled: false,
    isError: true,
    error,
  });

  const useLoader = (): (<TState, TParams>(
    id: AppKey,
    mode: AppKey,
    params: TParams,
    promiseFactory: PromiseFactory<TState, TParams>,
  ) => Promise<ApiCallResult<TState, TError>>) => {
    const updateLoader = useLoaderStateSetter();
    const clientFactory = useClientFactory();
    return useCallback(
      <TState, TParams>(
        id: AppKey,
        mode: AppKey = '',
        params: TParams,
        promiseFactory: PromiseFactory<TState, TParams>,
      ) => {
        const [client, clientAdapter] = clientFactory();
        updateLoader(waitingLoaderData(id, mode, clientAdapter.cancel.bind(client)), true);
        return promiseFactory(client, params)
          .then((data) => {
            updateLoader(okLoaderData(id, mode));
            return successApiCallResult(data);
          })
          .catch((error) => {
            if (clientAdapter.isCanceled(error)) return canceledApiCallResult<TState>();
            const clientError = clientAdapter.parseError(error);
            updateLoader(errorLoaderData(id, mode, clientError));
            return errorApiCallResult<TState, TError>(clientError);
          });
      },
      [clientFactory, updateLoader],
    );
  };

  const useLoaderInfo = (id: AppKey, mode: AppKey = ''): LoaderData<TError> | undefined =>
    useLoaderState().get(id)?.get(mode);

  const useCancelAction = (): ((id: AppKey, mode?: AppKey) => void) => {
    const updateLoader = useLoaderStateSetter();
    return useCallback(
      (id: AppKey, mode: AppKey = '') => updateLoader(okLoaderData(id, mode), true),
      [updateLoader],
    );
  };

  const useCancellation = (id: AppKey, mode: AppKey = ''): void => {
    const cancel = useCancelAction();
    useEffect(() => {
      return () => cancel(id, mode);
    }, [cancel, id, mode]);
  };

  const createApiHook = <TState, TParams>(promiseFactory: PromiseFactory<TState, TParams>) => {
    const id = hookId++ as AppKey;
    const useHook = () => {
      const loader = useLoader();
      const interceptor = useClientInterceptor();
      const doApiCall = useCallback(
        (params: TParams, mode: AppKey = ''): Promise<ApiCallResult<TState, TError>> =>
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

  const createApiHookWithState = <TState, TParams>(
    promiseFactory: PromiseFactory<TState, TParams>,
    initValue: TState | (() => TState),
  ) => {
    const apiHook = createApiHook(promiseFactory);
    const useHook = () => {
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
        (params: TParams, mode: AppKey = ''): Promise<ApiCallResult<TState, TError>> => {
          lastMode.current = mode;
          return actionApi(params, mode).then((apiCallResult) => {
            if (apiCallResult.isSuccess) setState(apiCallResult.data);
            return apiCallResult;
          });
        },
        [actionApi],
      );
      return [state, doApiCall, setState] as const;
    };
    useHook.id = apiHook.id;
    return useHook;
  };

  const LoaderContextProvider: React.FC<LoaderContextProviderProps<TClient, TError>> = ({
    children,
    clientInterceptorHook,
    clientFactory,
  }) => {
    const [loaderState, setLoaderState] = useState<LoaderState<TError>>(
      new Map<string, Map<AppKey, LoaderData<TError>>>(),
    );
    const updateLoader = useCallback((item: LoaderData<TError>, shouldCancelCurrent = false) => {
      setLoaderState((state) => {
        const newState = new Map(state);
        const oldSubState = newState.get(item.id);
        const newSubState =
          oldSubState != null ? new Map(oldSubState) : new Map<AppKey, LoaderData<TError>>();
        if (shouldCancelCurrent) {
          const oldItem = newSubState.get(item.mode);
          if (oldItem?.isWaiting) oldItem.cancel();
        }
        return newState.set(item.id, newSubState.set(item.mode, item));
      });
    }, []);
    return (
      <ClientFactoryContext.Provider value={clientFactory}>
        <ClientInterceptorHookContext.Provider value={clientInterceptorHook}>
          <LoaderStateSetterContext.Provider value={updateLoader}>
            <LoaderStateContext.Provider value={loaderState}>
              {children}
            </LoaderStateContext.Provider>
          </LoaderStateSetterContext.Provider>
        </ClientInterceptorHookContext.Provider>
      </ClientFactoryContext.Provider>
    );
  };

  return {
    LoaderStateContext,
    LoaderStateSetterContext,
    ClientFactoryContext,
    ClientInterceptorHookContext,
    useLoaderState,
    useLoaderStateSetter,
    useClientFactory,
    useClientInterceptor,
    okLoaderData,
    waitingLoaderData,
    errorLoaderData,
    successApiCallResult,
    canceledApiCallResult,
    errorApiCallResult,
    useLoader,
    useLoaderInfo,
    useCancelAction,
    useCancellation,
    createApiHook,
    createApiHookWithState,
    LoaderContextProvider,
  } as const;
};
