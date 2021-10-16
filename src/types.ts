export type AppKey = string | number;

export type ReceiveValue<T> = (value: T) => void;

export type ProduceValue<T> = () => T;

export type ModifyValue<T> = (value: T) => T;

export type TransformValue<T1, T2> = (value: T1) => T2;

export type SetterType<T> = ReceiveValue<T | ModifyValue<T>>;

export type InitType<T> = T | ProduceValue<T>;

export interface IHttpClientError {
  description: string | string[];
  status?: number;
  data?: unknown;
}

export interface IHttpClient {
  get<T>(
    url: string,
    params?: unknown,
    headers?: Record<string, string>,
    settings?: Record<string, unknown>,
  ): Promise<T>;
  post<T>(
    url: string,
    data?: unknown,
    params?: unknown,
    headers?: Record<string, string>,
    settings?: Record<string, unknown>,
  ): Promise<T>;
  cancel(): void;
  isCanceled(error: unknown): boolean;
  parseError(error: unknown): IHttpClientError;
}

export interface IHttpClientFactory {
  (): IHttpClient;
}

export type LoaderState = Map<AppKey, Map<AppKey, LoaderData>>;

export type LoaderStateSetter = (item: LoaderData, shouldCancelCurrent?: boolean) => void;

export type LoaderData = {
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
      readonly error: IHttpClientError;
    }
);

export type ApiCallResult<T> =
  | {
      readonly isSuccess: true;
      readonly isCanceled: false;
      readonly isError: false;
      readonly data: T;
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
      readonly error: IHttpClientError;
    };
