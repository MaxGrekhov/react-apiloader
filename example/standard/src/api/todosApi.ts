import { createApiHookWithState } from '@/core/loader';

export interface TodoModel {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export const useGetTodos = createApiHookWithState<TodoModel[] | undefined, { userId: number }>(
  (http, params) =>
    http.get<TodoModel[]>(`users/${params.userId}/todos`),
  undefined,
);
