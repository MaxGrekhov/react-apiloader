import qs from 'query-string';
import React, { Suspense, useCallback, useEffect, useState, type FC } from 'react';
import {
  type AppKey,
  type ClientAdapter,
  type ClientFactory,
  createLoaderApi,
} from 'react-apiloader';
import ReactDOM from 'react-dom/client';

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Simulate API delay for example purposes
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const API_DELAY_MS = 1000;
const withDelay = <T,>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), API_DELAY_MS));

interface GlobalStateExample {
  getToken: () => string | undefined;
  reset: () => void;
}

type ClientError = {
  description: string | string[];
  status?: number;
  data?: unknown;
};

interface IFetchClient {
  get<T>(url: string, params?: unknown, settings?: RequestInit): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, params?: unknown, settings?: RequestInit): Promise<T>;
}

const {
  createApiHook,
  createApiHookWithState,
  createApiHookWithExternalState,
  LoaderContextProvider,
  useLoaderInfo,
} = createLoaderApi<IFetchClient, ClientError>();

class InternalError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
  }
}

export const createClientFactory =
  (baseUrl: string, state: GlobalStateExample): ClientFactory<IFetchClient, ClientError> =>
  () => {
    const controller = new AbortController();
    const token = state.getToken();
    const auth: { Authorization: string } | Record<string, never> =
      token != null ? { Authorization: 'Bearer ' + token } : {};

    const defaultHeaders = (contentType: string | null) =>
      contentType
        ? {
            'Content-Type': contentType,
            ...auth,
          }
        : {
            ...auth,
          };
    const handleResponse = async <T,>(response: Response): Promise<T> => {
      const text = await response.text();
      let data: unknown = undefined;
      try {
        if (text != null && text != '') data = JSON.parse(text);
      } catch (e) {
        console.error(e, text);
      }
      if (!response.ok) {
        if (response.status === 401) {
          state.reset();
        } else if (response.status === 409) {
          window.location.reload();
        }
        throw new InternalError(response.statusText, response.status, data);
      }
      return data as T;
    };

    const createUrl = (url: string, params?: Record<string, unknown>): string => {
      const queryString = params ? '?' + qs.stringify(params, { arrayFormat: 'index' }) : '';
      return `${baseUrl}${url}${queryString}`;
    };

    const client: IFetchClient = {
      get: async <T,>(url: string, params?: Record<string, unknown>, settings?: RequestInit) =>
        fetch(createUrl(url, params), {
          method: 'GET',
          headers: defaultHeaders('application/json'),
          signal: controller.signal,
          ...settings,
        })
          .then(withDelay)
          .then((response) => handleResponse<T>(response)),

      post: async <T, D = unknown>(
        url: string,
        data?: D,
        params?: Record<string, unknown>,
        settings?: RequestInit,
      ) => {
        return fetch(createUrl(url, params), {
          method: 'POST',
          headers: defaultHeaders(data instanceof FormData ? null : 'application/json'),
          body: data instanceof FormData ? data : JSON.stringify(data),
          signal: controller.signal,
          ...settings,
        })
          .then(withDelay)
          .then((response) => handleResponse<T>(response));
      },
    };

    const adapter: ClientAdapter<ClientError> = {
      cancel: () => controller.abort(),
      isCanceled: (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
      parseError: (error: unknown) => {
        console.error('# ERROR #', error);
        if (error instanceof InternalError) {
          const data = error.data as {
            isError: boolean;
            message: string;
            title: string;
          };
          return {
            description: data?.isError ? data.message : (data?.title ?? 'Network response error'),
            data,
            status: error.status,
          };
        }
        return {
          description: (error as Error)?.message ?? 'Unknown error',
        };
      },
    };

    return [client, adapter];
  };

const state: GlobalStateExample = {
  getToken: () => 'token',
  reset: () => {},
};
const clientFactory = createClientFactory('https://jsonplaceholder.typicode.com/', state);

export interface TodoModel {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

interface UserModel {
  id: number;
  username: string;
}

const useGetUser = createApiHookWithExternalState<UserModel | undefined, number>(
  // we can convert the params and pass to HttpClient where it will be converted to query string
  // depending on the implementation of the HttpClient
  // also we can mutate the data here, in our case we just return the first element
  (http, params) => http.get<UserModel[]>(`users`, { id: params }).then((x) => x[0]),
  // let's assume it's hook from a global state management library
  useState,
);

const useGetTodos = createApiHookWithState<TodoModel[] | undefined, { userId: number }>(
  (http, params) =>
    http.get<TodoModel[]>(`todos`, { userId: params.userId }).then((data) => {
      console.log('data', data);
      // We can mutate the data here if needed
      // Example: parse date string to Date object
      return data;
    }),
  undefined,
);

const useSaveTodo = createApiHook<TodoModel | undefined, TodoModel>(
  // we can do something with the params
  // for example, we can serialize the params in specific format
  (http, params) =>
    http.post<TodoModel>(`todos`, params).then((data) => {
      // we can still receive the data back from the server
      return data;
    }),
);

export type LoadingButtonProps = {
  actionType: AppKey;
  mode?: AppKey;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export const LoadingButton: FC<LoadingButtonProps> = ({
  actionType,
  mode = undefined,
  children,
  disabled,
  onClick,
}) => {
  // we can get information about any request in the app
  const item = useLoaderInfo(actionType, mode);
  const isDisabled = item?.isWaiting || disabled;
  return (
    <button disabled={isDisabled} onClick={onClick} style={{ marginLeft: '10px' }}>
      {item?.isWaiting ? 'Loading...' : children}
    </button>
  );
};

interface RepeatPanelProps {
  actionType: AppKey;
  mode?: AppKey;
  action: () => void;
  children: React.ReactNode;
}

export const RepeatPanel: FC<RepeatPanelProps> = ({ actionType, mode, action, children }) => {
  // we can get information about any request in the app
  const item = useLoaderInfo(actionType, mode);

  if (item?.isWaiting) return <div>Loading...</div>;

  if (item?.isError)
    return (
      <div>
        <div>Cannot get data from the server</div>
        <div>
          <button onClick={action}>Try Again</button>
        </div>
      </div>
    );

  return <>{children}</>;
};

const App = () => {
  const [user, getUserApi /*, setUser*/] = useGetUser();
  const getUser = useCallback(() => getUserApi(1), [getUserApi]);
  useEffect(() => void getUser(), [getUser]);

  const [todos, getTodosApi /*, setTodos*/] = useGetTodos();
  const getTodos = useCallback(() => {
    if (user) {
      void getTodosApi({ userId: user.id });
    }
  }, [getTodosApi, user]);
  useEffect(() => void getTodos(), [getTodos]);

  const saveTodoApi = useSaveTodo();
  const saveTodo = useCallback(
    (todo: TodoModel) => {
      // the second parameter sets the mode
      // it helps execute parallel requests
      void saveTodoApi(todo, todo.id)
        .then((x) => {
          console.log('Place to do additional actions and check the result');
          if (x.isSuccess) {
            console.log('Save success, typed data:', x.data);
          } else if (x.isCanceled) {
            console.log('Save canceled, no data');
          } else if (x.isError) {
            console.log('Error saving todo:', x.error);
          }
          return;
        })
        .catch((e) => console.log('we can organize error handling', e));
    },
    [saveTodoApi],
  );

  return (
    <>
      <h1>React API Loader Minimal Example</h1>
      <RepeatPanel actionType={useGetUser.id} action={getUser}>
        <h2>{'User: ' + (user?.username ?? 'Not found')}</h2>
        <h3>
          Todos
          <LoadingButton actionType={useGetTodos.id} onClick={getTodos}>
            Refresh
          </LoadingButton>
        </h3>
        <RepeatPanel actionType={useGetTodos.id} action={getTodos}>
          {todos?.map((todo) => (
            <div key={todo.id}>
              <span>{todo.title}</span>
              <LoadingButton
                actionType={useSaveTodo.id}
                onClick={() => saveTodo(todo)}
                // set mode to track specific request state
                mode={todo.id}>
                Save
              </LoadingButton>
            </div>
          ))}
        </RepeatPanel>
      </RepeatPanel>
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
root.render(
  <React.StrictMode>
    <LoaderContextProvider clientFactory={clientFactory}>
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </LoaderContextProvider>
  </React.StrictMode>,
);
