import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Alert } from "@/lib/types";

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts(),
    queryFn: () => api.adminAlerts(),
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.dismissAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
    },
  });
}
