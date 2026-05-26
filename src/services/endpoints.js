import resources from '@/config/endpoints.json';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const endpoint = (resource) => BASE_URL + resources[resource];
