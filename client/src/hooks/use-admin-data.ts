import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

interface UseAdminDataOptions<T> {
  endpoint: string;
  defaultLimit?: number;
  transform?: (data: any) => T[];
}

export function useAdminData<T>({
  endpoint,
  defaultLimit = 10,
  transform,
}: UseAdminDataOptions<T>) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const fetchData = useCallback(
    async (page: number, appliedFilters: Record<string, any> = {}) => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: defaultLimit.toString(),
          ...appliedFilters,
        });

        const response = await apiRequest("GET", `${endpoint}?${params}`);

        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          navigate("/login?reason=session-expired");
          return;
        }

        const jsonData = await response.json();
        const result: PaginatedResponse<T> = transform
          ? {
              ...jsonData,
              data: transform(jsonData.data),
            }
          : jsonData;

        setData(result.data);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setTotalItems(result.total);
      } catch (err) {
        setError(err as Error);
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [endpoint, defaultLimit, transform, toast, navigate]
  );

  // Fetch data when page or filters change
  useEffect(() => {
    fetchData(currentPage, filters);
  }, [currentPage, filters, fetchData]);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refresh = useCallback(() => {
    fetchData(currentPage, filters);
  }, [currentPage, filters, fetchData]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    filters,
    setFilters: handleFilterChange,
    setPage: handlePageChange,
    refresh,
  };
}

// Action hook for common admin actions
interface UseAdminActionsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useAdminActions(
  baseEndpoint: string,
  options: UseAdminActionsOptions = {}
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const executeAction = async (
    method: string,
    path: string,
    data?: any
  ): Promise<any> => {
    setLoading(true);
    try {
      const response = await apiRequest(method, `${baseEndpoint}${path}`, data);

      if (!response.ok) {
        throw new Error("Action failed");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: result.message || "Action completed successfully",
      });

      options.onSuccess?.();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      options.onError?.(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    executeAction,
  };
}
