// API configuration
// Using proxy route to mask the actual API endpoint
export const API_BASE_URL = '/api/proxy';

// Helper function to construct API URLs
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
}

// Example usage:
// const url = getApiUrl('admin/users');
// Result: '/api/proxy/admin/users'
