import { useCallback } from 'react';
import { getErrorMessage } from '../lib/error';
import { usePageMode } from './usePageMode';

export type ModeAwareResult = { ok: true } | { ok: false; error: string };

type ModeAwareHandler<TData> = (data: TData) => void | Promise<void>;

export interface ModeAwareHandlers<TData> {
  visitor: ModeAwareHandler<TData>;
  demo: ModeAwareHandler<TData>;
  live: ModeAwareHandler<TData>;
}

export function useModeAwareAction<TData>(handlers: ModeAwareHandlers<TData>) {
  const mode = usePageMode();

  return useCallback(
    async (data: TData): Promise<ModeAwareResult> => {
      try {
        await handlers[mode](data);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
      }
    },
    [handlers, mode]
  );
}
