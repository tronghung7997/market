import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Provider, ProviderHealth } from "@/lib/types";

export function useProviders() {
  return useQuery({
    queryKey: queryKeys.providers(),
    queryFn: () => api.providers(),
  });
}

export function useProviderHealth(id: number | null) {
  return useQuery({
    queryKey: queryKeys.providerHealth(id ?? 0),
    queryFn: () => api.providerHealth(id!),
    enabled: !!id,
  });
}

export function useProviderProducts(id: number | null) {
  return useQuery({
    queryKey: queryKeys.providerProducts(id ?? 0),
    queryFn: () => api.providerProducts(id!),
    enabled: !!id,
  });
}
