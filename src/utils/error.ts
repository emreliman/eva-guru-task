export function extractApiError(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error_description' in error.response.data
  ) {
    return (error.response as { error_description?: string }).error_description || fallback;
  }
  return fallback;
} 