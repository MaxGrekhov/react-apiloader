import { useCallback, useState } from 'react';

export const useStateEx = <S,>(initialState: S | (() => S)) => {
  const [value, setValue] = useState<S>(initialState);
  const setter = useCallback(
    (x: keyof S) => (v: unknown) => setValue((s) => ({ ...s, [x]: v })),
    [setValue],
  );
  return [value, setValue, setter] as const;
};

