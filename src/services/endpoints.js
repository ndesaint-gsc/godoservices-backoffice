import resources from '@/config/endpoints.json';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Resolve a named resource from config/endpoints.json.
export const endpoint = (resource) => BASE_URL + resources[resource];

// Build an arbitrary API path (prefixed with the configured base URL).
// Use this in domain services so each can own its own paths without
// editing the shared endpoints.json.
export const apiUrl = (path) => BASE_URL + path;
