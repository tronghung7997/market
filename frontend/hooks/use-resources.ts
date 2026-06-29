import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export interface ResourceFilters {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.resources(filters as Record<string, unknown>),
    queryFn: () => api.adminResources(filters),
  });
}

export function useResourceSummary() {
  return useQuery({
    queryKey: queryKeys.resourceSummary(),
    queryFn: () => api.adminResourceSummary(),
  });
}
