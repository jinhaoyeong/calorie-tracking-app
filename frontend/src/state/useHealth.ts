import { useEffect, useState } from 'react';
import { fetchHealth, type Health } from '../lib/api';

export type HealthState = { status: 'loading' } | { status: 'online'; health: Health } | { status: 'offline' };

let cached: Promise<Health> | null = null;

/** Recognition service status, fetched once per session and shared between screens. */
export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    cached ??= fetchHealth();
    cached
      .then((health) => active && setState({ status: 'online', health }))
      .catch(() => {
        cached = null;
        if (active) setState({ status: 'offline' });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
