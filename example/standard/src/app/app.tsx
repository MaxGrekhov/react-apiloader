import type { FC } from 'react';

import { useAuth } from '@/global/useAuth';

import { LoginPage } from './loginPage';
import { TodosPage } from './todosPage';

export const App: FC = () => {
  const [auth] = useAuth();
  console.log('App auth: ', auth);
  return auth == null ? <LoginPage /> : <TodosPage />;
};
