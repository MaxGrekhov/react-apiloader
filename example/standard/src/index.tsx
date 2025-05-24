import './index.css';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import { App } from '@/app/app';
import { GlobalState, GlobalStateContext } from '@/core/globalState';
import { createClientFactory, LoaderContextProvider } from '@/core/loader';

const state = new GlobalState();
const clientFactory = createClientFactory('https://jsonplaceholder.typicode.com/', state);

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
root.render(
  <React.StrictMode>
      <GlobalStateContext.Provider value={state}>
        <LoaderContextProvider clientFactory={clientFactory}>
            <Suspense fallback="Loading...">
              <App />
            </Suspense>
        </LoaderContextProvider>
      </GlobalStateContext.Provider>
  </React.StrictMode>,
);
