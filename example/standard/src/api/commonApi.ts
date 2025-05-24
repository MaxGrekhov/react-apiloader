import { z } from 'zod';

import { createApiHookWithExternalState, createApiHookWithState } from '@/core/loader';
import { type AuthInfo, useAuth } from '@/global/useAuth';

export const LoginCommandSchema = z.object({
  username: z.string().min(3, 'Username is too short'),
  password: z.string().min(3, 'Password is too short'),
});

export type LoginCommand = z.infer<typeof LoginCommandSchema>;

const baseUrl = 'users/';

export const useLogin = createApiHookWithExternalState<AuthInfo | undefined, LoginCommand>(
  (http, params) =>
    http.get<AuthInfo[]>(baseUrl /*+ 'login'*/, { username: params.username }).then((x) => {
      // parse the response and emulate an error if needed
      if (Array.isArray(x) && x.length > 0) {
        return x[0];
      }
      throw new Error('User or password is incorrect');
    }),
  useAuth,
);

export const useGetUserNames = createApiHookWithState<string[] | undefined, void>(
  (http, params) =>
    http.get<AuthInfo[]>(baseUrl /*+ 'GetUserNames'*/, params).then((x) => {
      return x.map((y) => y.username);
    }),
  undefined,
);
