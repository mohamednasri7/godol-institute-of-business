import { useEffect, useRef } from 'react';
import { supabase, isSupabaseClientConfigured } from '../lib/supabase';

// Shared BroadcastChannel for instant inter-tab communication across tabs in the same browser (0ms latency)
let sharedBroadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    sharedBroadcastChannel = new BroadcastChannel('godol_sync_channel');
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

/**
 * Broadcasts a data change event to all other open tabs in the user's browser.
 * e.g., when an admin adds/edits a course, other tabs immediately receive this event and refresh.
 */
export function broadcastDataChange(table, action = 'update') {
  if (sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel.postMessage({ table, action, timestamp: Date.now() });
    } catch {}
  }
}

/**
 * useRealtimeSync:
 * 1. Subscribes to Supabase Realtime WebSocket changes for given PostgreSQL table(s).
 * 2. Listens to BroadcastChannel for instant (0ms) inter-tab sync.
 * 3. Listens to visibilitychange & window.focus to auto-refetch the instant the user returns to the tab.
 * 4. Debounces rapid successive triggers to prevent network spam.
 *
 * @param {string|string[]} tables - Supabase table name(s) e.g. 'courses' or ['courses', 'categories']
 * @param {Function} onRefresh - Callback function to refetch data
 * @param {Object} [options] - Optional configurations
 */
export function useRealtimeSync(tables, onRefresh, options = {}) {
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  const tableList = Array.isArray(tables) ? tables : [tables];
  const lastTriggerRef = useRef(0);

  const triggerRefresh = (source = 'unknown') => {
    const now = Date.now();
    // Debounce triggers within 350ms
    if (now - lastTriggerRef.current < 350) return;
    lastTriggerRef.current = now;

    if (typeof refreshRef.current === 'function') {
      try {
        refreshRef.current(source);
      } catch (err) {
        console.error('useRealtimeSync refresh error:', err);
      }
    }
  };

  useEffect(() => {
    // 1. Tab Focus & Visibility change: auto-refresh when switching back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh('visibilitychange');
      }
    };
    const handleFocus = () => {
      triggerRefresh('focus');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 2. Inter-tab BroadcastChannel listener (instant 0ms sync between open tabs)
    const handleBroadcast = (event) => {
      const data = event.data;
      if (!data) return;
      if (
        data.table === '*' ||
        tableList.includes(data.table) ||
        tableList.includes('*')
      ) {
        triggerRefresh(`broadcast-${data.table}`);
      }
    };

    if (sharedBroadcastChannel) {
      sharedBroadcastChannel.addEventListener('message', handleBroadcast);
    }

    // 3. Supabase Realtime WebSocket subscription (instant across all browsers and devices)
    let channel = null;
    if (isSupabaseClientConfigured && supabase) {
      const channelName = `rt-${tableList.join('-')}-${Math.random().toString(36).slice(2, 7)}`;
      channel = supabase.channel(channelName);

      tableList.forEach((tbl) => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => {
          triggerRefresh(`supabase-${tbl}`);
        });
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED' && options.onStatusChange) {
          options.onStatusChange(true);
        }
      });
    }

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (sharedBroadcastChannel) {
        sharedBroadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [tableList.join(',')]);
}

