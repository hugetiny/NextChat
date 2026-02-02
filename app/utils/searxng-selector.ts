import { useEffect, useState } from "react";

export interface SpeedTestResult {
  url: string;
  latency: number;
  ok: boolean;
}

export const DEFAULT_SEARXNG_INSTANCES = [
  "https://searx.be",
  "https://searx.work",
  "https://searx.aicamp.cn",
  "https://s.search.ch",
];

const fetchInstancesFromNetwork = async (): Promise<string[] | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://searx.space/data/instances.json", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.instances) return null;

    const urls = Object.keys(data.instances).filter((url) => {
      const instance = data.instances[url];
      return (
        instance.network_type === "normal" &&
        instance.http &&
        instance.http.status_code === 200 &&
        instance.http.grade !== "F" &&
        instance.tls &&
        instance.tls.grade >= "B"
      );
    });

    return urls.length > 0 ? urls : null;
  } catch (error) {
    console.debug("SearxNG instances fetch failed", error);
    return null;
  }
};

export const fetchSearxngInstances = async (): Promise<string[]> => {
  const urls = await fetchInstancesFromNetwork();
  return urls ?? DEFAULT_SEARXNG_INSTANCES;
};

export const testSearxngSpeed = async (
  instances?: string[],
): Promise<SpeedTestResult[]> => {
  const targetInstances = instances || (await fetchSearxngInstances());

  const candidates = targetInstances
    .sort(() => 0.5 - Math.random())
    .slice(0, 20);

  const results: SpeedTestResult[] = [];

  const pingInstance = (url: string): Promise<SpeedTestResult> => {
    return new Promise((resolve) => {
      const start = Date.now();
      const img = new Image();

      const timeout = setTimeout(() => {
        img.src = "";
        resolve({ url, latency: Infinity, ok: false });
      }, 3000);

      const handleResponse = () => {
        clearTimeout(timeout);
        const latency = Date.now() - start;
        resolve({ url, latency, ok: true });
      };

      img.onload = handleResponse;
      img.onerror = handleResponse;

      const baseUrl = url.endsWith("/") ? url : url + "/";
      img.src = `${baseUrl}favicon.ico?t=${start}`;
    });
  };

  const batchSize = 5;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(pingInstance));
    results.push(...batchResults);
  }

  return results
    .filter((r) => r.ok && r.latency < 2000)
    .sort((a, b) => a.latency - b.latency);
};

export const getFastestInstance = async (): Promise<string | null> => {
  const results = await testSearxngSpeed();
  return results.length > 0 ? results[0].url : null;
};

export function useFastestSearxng() {
  const [fastestUrl, setFastestUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const find = async () => {
      setLoading(true);
      const cached = localStorage.getItem("fastest_searxng");
      const cachedTime = localStorage.getItem("fastest_searxng_time");

      if (
        cached &&
        cachedTime &&
        Date.now() - parseInt(cachedTime) < 1000 * 60 * 60
      ) {
        setFastestUrl(cached);
        setLoading(false);
        return;
      }

      const url = await getFastestInstance();
      if (url) {
        setFastestUrl(url);
        localStorage.setItem("fastest_searxng", url);
        localStorage.setItem("fastest_searxng_time", Date.now().toString());
      }
      setLoading(false);
    };

    find();
  }, []);

  return { fastestUrl, loading };
}
