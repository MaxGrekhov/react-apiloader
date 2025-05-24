import qs from 'query-string';
import { type ClientAdapter, type ClientFactory, createLoaderApi } from 'react-apiloader';

import { authInfoAtom } from '@/global/useAuth';

import { GlobalState } from './globalState';

export { type AppKey } from 'react-apiloader';

// Configure the API delay in milliseconds (0 means no delay)
export const API_DELAY_MS = 1000;

/**
 * Adds a delay to any promise
 * @param promise The promise to wrap with a delay
 * @returns A new promise that resolves after the delay
 */
const withDelay = <T>(data: T): Promise<T> => {
  if (API_DELAY_MS <= 0) {
    return Promise.resolve(data);
  }

  return new Promise((resolve) => setTimeout(() => resolve(data), API_DELAY_MS));
};

export type ClientError = {
  description: string | string[];
  status?: number;
  data?: unknown;
};

export interface IFetchClient {
  get<T>(url: string, params?: unknown, settings?: RequestInit): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, params?: unknown, settings?: RequestInit): Promise<T>;
  put<T, D = unknown>(url: string, data?: D, params?: unknown, settings?: RequestInit): Promise<T>;
  delete<T>(url: string, params?: unknown, settings?: RequestInit): Promise<T>;
}

export const {
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
  (baseUrl: string, state: GlobalState): ClientFactory<IFetchClient, ClientError> =>
  () => {
    const controller = new AbortController();
    // let's assume username is a token
    const token = state.tryGet(authInfoAtom)?.value()?.username;
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
    const handleResponse = async <T>(response: Response): Promise<T> => {
      const text = await response.text();
      let data: unknown = undefined;
      try {
        if (text != null && text != '') data = JSON.parse(text);
      } catch (e) {
        console.error(e, text);
      }
      if (!response.ok) {
        if (response.status === 401) {
          state.tryGet(authInfoAtom)?.setValue(undefined);
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
      get: async <T>(url: string, params?: Record<string, unknown>, settings?: RequestInit) =>
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

      put: async <T, D = unknown>(
        url: string,
        data?: D,
        params?: Record<string, unknown>,
        settings?: RequestInit,
      ) =>
        fetch(createUrl(url, params), {
          method: 'PUT',
          headers: defaultHeaders('application/json'),
          body: JSON.stringify(data),
          signal: controller.signal,
          ...settings,
        })
          .then(withDelay)
          .then((response) => handleResponse<T>(response)),

      delete: async <T>(url: string, params?: Record<string, unknown>, settings?: RequestInit) =>
        fetch(createUrl(url, params), {
          method: 'DELETE',
          headers: defaultHeaders('application/json'),
          signal: controller.signal,
          ...settings,
        })
          .then(withDelay)
          .then((response) => handleResponse<T>(response)),
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
