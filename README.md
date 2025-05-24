# React API Loader

A lightweight, type-safe React library that abstracts API-related infrastructure code, significantly reducing component complexity. React API Loader provides centralized state management for API operations, enables request cancellation, and offers reusable UI components to simplify handling loading, error, and success states.

## Installation

```bash
# Using npm
npm install react-apiloader

# Using yarn
yarn add react-apiloader

# Using pnpm
pnpm add react-apiloader
```

## Key Features

- 🔄 **Centralized API State Management**: Track loading and error states for all requests in one place
- 🎣 **Type-Safe Hooks**: Full TypeScript support with generics for parameters and responses
- ⚡ **Simplified Component Architecture**: Eliminate repetitive loading/error handling code
- 🚀 **Response Transformation**: Transform API responses before updating component state
- 🚫 **Automatic Request Cancellation**: Prevent memory leaks and race conditions
- 🔌 **Client Adapter Pattern**: Use with any HTTP client (fetch, Axios, etc.)
- 🧩 **Flexible State Management**: Choose between internal state, external state, or stateless options
- 🛠️ **Ready-to-Use UI Components**: LoadingButton and RepeatPanel for common UIs

## API Reference

The repository includes two example projects that demonstrate the library usage:

1. **Minimal Example** - A simple demonstration of core API features with basic implementation patterns. This example shows the essential functionality with minimal dependencies.

2. **Standard Example** - A more comprehensive implementation that demonstrates:
   - Recommended folder structure for larger applications
   - Integration with global state management
   - The `useMessage` hook for centralized error handling
   - Styling and UI component organization
   - Authentication flow integration

The examples below are based on the minimal implementation. For more advanced patterns, explore the standard example in the repository.

### Creating the API Context

First, import the library and define your client and error types:

```typescript
import { 
  type AppKey,
  type ClientAdapter,
  type ClientFactory,
  createLoaderApi,
} from 'react-apiloader';

// Define the error type for your API
type ClientError = {
  description: string | string[];
  status?: number;
  data?: unknown;
};

// Define your API client interface
interface IFetchClient {
  get<T>(url: string, params?: unknown, settings?: RequestInit): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, params?: unknown, settings?: RequestInit): Promise<T>;
}

// Create your API loader context and extract the hooks you need
const {
  createApiHook,
  createApiHookWithState,
  createApiHookWithExternalState,
  LoaderContextProvider,
  useLoaderInfo,
} = createLoaderApi<IFetchClient, ClientError>();
```

### Client Factory

Create a client factory that returns a client implementation and its adapter:

```typescript
const createClientFactory = 
  (baseUrl: string): ClientFactory<IFetchClient, ClientError> => () => {
    const controller = new AbortController();
    
    // Client implementation
    const client: IFetchClient = {
      get: async <T>(url: string, params?: Record<string, unknown>, settings?: RequestInit) =>
        fetch(createUrl(url, params), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          ...settings,
        })
          .then((response) => handleResponse<T>(response)),

      post: async <T, D = unknown>(
        url: string,
        data?: D,
        params?: Record<string, unknown>,
        settings?: RequestInit,
      ) => {
        return fetch(createUrl(url, params), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
          ...settings,
        })
          .then((response) => handleResponse<T>(response));
      },
    };

    // Client adapter for handling cancellation and errors
    const adapter: ClientAdapter<ClientError> = {
      cancel: () => controller.abort(),
      isCanceled: (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
      parseError: (error: unknown) => {
        console.error('# ERROR #', error);
        // Your error parsing logic
        return {
          description: (error as Error)?.message ?? 'Unknown error',
        };
      },
    };

    return [client, adapter];
  };

// Create a client factory instance
const clientFactory = createClientFactory('https://jsonplaceholder.typicode.com/');
```

### API Hooks

The library provides three types of API hooks for different use cases:

#### 1. createApiHook - Stateless Hook

For operations without internal state, like creating/updating resources:

```typescript
// Define a model for your data
interface TodoModel {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

// Create a hook for saving todos
const useSaveTodo = createApiHook<TodoModel | undefined, TodoModel>(
  (http, params) =>
    http.post<TodoModel>(`todos`, params).then((data) => {
      // Transform data if needed before returning
      return data;
    }),
);

// Usage in a component
const saveTodoApi = useSaveTodo();
const saveTodo = useCallback(
  (todo: TodoModel) => {
    // The second parameter sets the mode for parallel requests
    void saveTodoApi(todo, todo.id)
      .then((result) => {
        if (result.isSuccess) {
          console.log('Save success:', result.data);
        } else if (result.isCanceled) {
          console.log('Save canceled');
        } else if (result.isError) {
          console.log('Error saving:', result.error);
        }
      });
  },
  [saveTodoApi],
);
```

#### 2. createApiHookWithState - Hook with Internal State

For fetching data with internal state management:

```typescript
// Create a hook for fetching todos with internal state
const useGetTodos = createApiHookWithState<TodoModel[] | undefined, { userId: number }>(
  (http, params) =>
    http.get<TodoModel[]>(`todos`, { userId: params.userId }).then((data) => {
      // Transform data if needed
      return data;
    }),
  undefined, // Initial state value
);

// Usage in a component
const [todos, getTodosApi] = useGetTodos();
const getTodos = useCallback(() => {
  if (user) {
    void getTodosApi({ userId: user.id });
  }
}, [getTodosApi, user]);

// Call the API on component mount
useEffect(() => void getTodos(), [getTodos]);

// Render the data
return (
  <div>
    {todos?.map((todo) => (
      <div key={todo.id}>{todo.title}</div>
    ))}
  </div>
);
```

#### 3. createApiHookWithExternalState - Hook with External State

For updating global/external state sources:

```typescript
interface UserModel {
  id: number;
  username: string;
}

// Using React's useState as an example of an external state
// In real apps, this could be a Redux store, Jotai atom, etc.
const useGetUser = createApiHookWithExternalState<UserModel | undefined, number>(
  (http, params) => http.get<UserModel[]>(`users`, { id: params }).then((x) => x[0]),
  useState, // External state hook
);

// Usage in a component
const [user, getUserApi] = useGetUser();
const getUser = useCallback(() => getUserApi(1), [getUserApi]);

// Call the API on component mount
useEffect(() => void getUser(), [getUser]);

// User state is automatically updated when API call succeeds
return <h2>{'User: ' + (user?.username ?? 'Not found')}</h2>;
```

### Infrastructure Components

These ready-to-use components help you handle loading and error states consistently:

#### LoadingButton

A button that displays a loading indicator and disables itself while an API call is in progress:

```tsx
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
  // Get the current state of the specified API call
  const item = useLoaderInfo(actionType, mode);
  const isDisabled = item?.isWaiting || disabled;
  return (
    <button disabled={isDisabled} onClick={onClick}>
      {item?.isWaiting ? 'Loading...' : children}
    </button>
  );
};
```

#### RepeatPanel

A component that handles loading, error, and success states:

```tsx
interface RepeatPanelProps {
  actionType: AppKey;
  mode?: AppKey;
  action: () => void;
  children: React.ReactNode;
}

export const RepeatPanel: FC<RepeatPanelProps> = ({ actionType, mode, action, children }) => {
  // Get the current state of the specified API call
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
```

### Setting up the Provider

Wrap your application with the `LoaderContextProvider`:

```tsx
// Root component
const App = () => {
  // Your application components
  return <h1>React API Loader Example</h1>;
};

// Render with the provider
ReactDOM.createRoot(document.getElementById('root') as Element).render(
  <React.StrictMode>
    <LoaderContextProvider clientFactory={clientFactory}>
      <Suspense fallback="Loading...">
        <App />
      </Suspense>
    </LoaderContextProvider>
  </React.StrictMode>,
);
```

### Complete Example

Here's a complete example showing how everything works together:

```tsx
const App = () => {
  // User data with external state
  const [user, getUserApi] = useGetUser();
  const getUser = useCallback(() => getUserApi(1), [getUserApi]);
  useEffect(() => void getUser(), [getUser]);

  // Todos with internal state
  const [todos, getTodosApi] = useGetTodos();
  const getTodos = useCallback(() => {
    if (user) {
      void getTodosApi({ userId: user.id });
    }
  }, [getTodosApi, user]);
  useEffect(() => void getTodos(), [getTodos]);

  // Stateless API for saving todos
  const saveTodoApi = useSaveTodo();
  const saveTodo = useCallback(
    (todo: TodoModel) => {
      void saveTodoApi(todo, todo.id)
        .then((x) => {
          if (x.isSuccess) {
            console.log('Save success:', x.data);
          } else if (x.isCanceled) {
            console.log('Save canceled');
          } else if (x.isError) {
            console.log('Error saving todo:', x.error);
          }
        });
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
                // Set mode to track specific request state
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
```

## Additional Information

### useCancellation

Automatically cancel API calls when a component unmounts:

```tsx
function SearchComponent() {
  const searchApi = useSearch();
  
  // This will automatically cancel pending search requests
  // when the component unmounts
  useCancellation(useSearch.id);
  
  // Component implementation
}
```

### useCancelAction

Manually cancel API calls from anywhere:

```tsx
function SearchWithCancel() {
  const searchApi = useSearch();
  const cancelAction = useCancelAction();
  
  return (
    <div>
      <button onClick={() => searchApi({ query: 'test' })}>Search</button>
      <button onClick={() => cancelAction(useSearch.id)}>Cancel</button>
    </div>
  );
}
```

### ClientInterceptorHook

Process API responses globally before they reach components:

```tsx
// Create an interceptor
const clientInterceptorHook: ClientInterceptorHook<ClientError> = () => {
  return (result) => {
    // Log all API responses
    console.log('API response:', result);
    
    // Handle specific errors globally
    if (result.isError && result.error.status === 401) {
      // Redirect to login page or show an auth error
      window.location.href = '/login';
    }
    // Show a toast notification for errors
    const [addToast] = useToaster();
    if (result.isError) {
      addToast({
        type: 'error',
        message: result.error.description,
      });
    }
    // Return the result to continue processing   
    return result;
  };
};

// Provide the interceptor to the context
<LoaderContextProvider 
  clientFactory={clientFactory}
  clientInterceptorHook={clientInterceptorHook}>
  <App />
</LoaderContextProvider>
```

### Request Modes

The `mode` parameter allows handling multiple concurrent API calls of the same type:

```tsx
// Create a stateless hook
const useSearchProducts = createApiHook<Product[], { query: string }>(
  (client, params) => client.get(`/search?q=${params.query}`),
);

function SearchPage() {
  const searchApi = useSearchProducts();
  
  // Execute multiple parallel searches with different modes
  const searchBooks = () => searchApi({ query: 'books' }, 'books');
  const searchMovies = () => searchApi({ query: 'movies' }, 'movies');
  
  return (
    <div>
      <h3>Product Search</h3>
      <div>
        {/* LoadingButton handles waiting state automatically */}
        <LoadingButton 
          actionType={useSearchProducts.id} 
          mode="books" 
          onClick={searchBooks}>
          Search Books
        </LoadingButton>
        
        <LoadingButton 
          actionType={useSearchProducts.id} 
          mode="movies" 
          onClick={searchMovies}>
          Search Movies
        </LoadingButton>
      </div>
    </div>
  );
}
```

## License

MIT © [Max Grekhov](https://github.com/MaxGrekhov)
