import { useCallback, useEffect, type FC } from 'react';

import { useGetTodos } from '@/api/todosApi';
import { useAuth } from '@/global/useAuth';
import { Button, Center, CheckboxField, Grid, LoadingButton, Panel, RepeatPanel } from '@/shared';

export const TodosPage: FC = () => {
  const [auth, setAuth] = useAuth();
  const [todos, getTodosApi] = useGetTodos();
  const getTodos = useCallback(() => void getTodosApi({ userId: auth!.id }), [auth, getTodosApi]);
  useEffect(() => getTodos(), [getTodos]);
  return (
    <Center className="p-4">
      <Grid className="w-lg">
        <Panel className="justify-between">
          {auth?.username} <Panel>
            <LoadingButton actionType={useGetTodos.id} onClick={() => getTodos()}>Refresh</LoadingButton>
            <Button onClick={() => setAuth(undefined)}>Sign Out</Button>
          </Panel>
        </Panel>
        <Panel><strong>User&apos;s Todo List</strong></Panel>
        <RepeatPanel action={getTodos} actionType={useGetTodos.id}>
          {todos?.map((todo) => (
            <Grid key={todo.id}>
              <Panel>
                <CheckboxField
                  name={`todo-${todo.id}`}
                  checked={todo.completed}
                  label={todo.title}
                  disabled={true}
                />
              </Panel>
            </Grid>
          ))}
        </RepeatPanel>
      </Grid>
    </Center>
  );
};

