"use client";

import { useState, useEffect, useCallback } from "react";

interface UseFetchDataOptions<T> {
  initialData?: T;
  autoFetch?: boolean;
}

export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchDataOptions<T> = {}
) {
  const { initialData, autoFetch = true } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err: unknown) {
      const errorMessage =
        (err as Error).message || "An unexpected error occurred while fetching data.";
      setError(errorMessage);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, [execute, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
}
