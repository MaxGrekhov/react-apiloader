import { useCallback, useEffect } from 'react';

import { type LoginCommand, LoginCommandSchema, useGetUserNames, useLogin } from '@/api/commonApi';
import { useMessages } from '@/core/useMessages';
import { useStateEx } from '@/core/useStateEx';
import { AppLogo, Center, Form, Grid, LoadingButton, RepeatPanel, TextField } from '@/shared';

export function LoginPage() {
  const [messages, setMessages] = useMessages(useLogin.id);
  const [form, setForm, setter] = useStateEx<LoginCommand>({
    username: '',
    password: '',
  });
  const [userNames, getUserNamesApi] = useGetUserNames();
  const getUserNames = useCallback(() => void getUserNamesApi(), [getUserNamesApi]);
  useEffect(() => getUserNames(), [getUserNames]);
  const [, loginApi] = useLogin();
  const login = useCallback(
    (data: LoginCommand) =>
      LoginCommandSchema.parseAsync(data)
        .then(loginApi)
        .then((x) => {
          console.log('Place to do additional actions');
          if (x.isSuccess) {
            console.log('Login success, typed data:', x.data);
          } else if (x.isCanceled) {
            console.log('Login canceled, no data');
          } else if (x.isError) {
            console.log('Login error, error:', x.error);
          }
          return;
        })
        .catch(setMessages),
    [loginApi, setMessages],
  );

  return (
    <Center className="h-screen p-4">
      <Form className="w-md" onSubmit={() => login(form)}>
        <Center>
          <AppLogo height="2rem" />
        </Center>
        <Grid>
          <TextField
            label="Username"
            name="username"
            onChange={setter('username')}
            value={form.username}
          />
          <TextField
            label="Password"
            name="password"
            onChange={setter('password')}
            type="password"
            value={form.password}
          />
        </Grid>
        <RepeatPanel action={getUserNames} actionType={useGetUserNames.id}>
          <p className="break-word">
            You can use any of these usernames with a random password:
          </p>
          <p className="break-all">
            {userNames &&
              userNames.map((x) => (
                <span
                  key={x}
                  className="text-blue-500 hover:underline cursor-pointer pr-2"
                  onClick={() => setForm({ username: x, password: x })}>
                  {x}
                </span>
              ))}
          </p>
        </RepeatPanel>
        {messages}
        <Center>
          <LoadingButton actionType={useLogin.id} type="submit">
            Sign In
          </LoadingButton>
        </Center>
      </Form>
    </Center>
  );
}
