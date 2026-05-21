import { Platform } from 'react-native';
import { ValuationRequest, ValuationResult } from './valuation';

export interface HistoryEntry {
  id: string;
  request: ValuationRequest;
  result: ValuationResult;
  createdAt: string;
}

const HISTORY_KEY = 'qimatnadz_history';
const MAX_HISTORY = 50;

function getStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
    };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  } catch {
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
    };
  }
}

export async function saveToHistory(
  request: ValuationRequest,
  result: ValuationResult
): Promise<HistoryEntry> {
  const storage = getStorage();
  const existing = await loadHistory();
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    request,
    result,
    createdAt: new Date().toISOString(),
  };
  const updated = [entry, ...existing].slice(0, MAX_HISTORY);
  await storage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return entry;
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const storage = getStorage();
  try {
    const raw = await storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  const storage = getStorage();
  await storage.setItem(HISTORY_KEY, JSON.stringify([]));
}
