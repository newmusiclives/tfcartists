"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMutationResult<T> {
  trigger: (body?: any) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    const currentUrl = urlRef.current;
    if (!currentUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(currentUrl, { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (url) fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useMutation<T = any>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST"
): UseMutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(
    async (body?: any): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message || `Request failed (${res.status})`);
        }
        const json = await res.json();
        setData(json);
        return json;
      } catch (err: any) {
        setError(err.message || "An error occurred");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method]
  );

  return { trigger, data, loading, error };
}
