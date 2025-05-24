import { createAtom, useAtom } from '@/core/globalState';

export type AuthInfo = {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
};

const key = 'AUTH_INFO';

export const authInfoAtom = createAtom<AuthInfo | undefined>({
  init: () => {
    const initJson = localStorage.getItem(key);
    return initJson ? (JSON.parse(initJson) as unknown as AuthInfo) : undefined;
  },
  set: (value) => {
    console.log('SET AUTH', value);
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return value;
  },
});

export const useAuth = () => useAtom(authInfoAtom);
