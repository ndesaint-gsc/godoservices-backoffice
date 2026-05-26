const MOCK_USER = {
  id: 'u-bck-001',
  email: 'admin.lavanguardia@example.com',
  name: 'Backoffice Admin',
  // Default roles on login. Switcher overrides at runtime.
  roles: ['MANAGER'],
};

// MVP: token is a fake constant. Real auth replaces this with a real session token.
const FAKE_TOKEN = 'mock-jwt-token-bck-mvp';

const login = async ({ email, password } = {}) => {
  // Accept anything. In real impl, validate against backend.
  await new Promise((r) => setTimeout(r, 200)); // simulate latency
  return { ...MOCK_USER, email: email || MOCK_USER.email };
};

const logout = async () => {
  await new Promise((r) => setTimeout(r, 50));
  return true;
};

const getAuthToken = async () => FAKE_TOKEN;

// Used by the dev role switcher to surface the list of predefined role-sets.
export const PREDEFINED_ROLE_SETS = [
  { label: '[VIEWER]', roles: ['VIEWER'] },
  { label: '[FINANCE_VIEWER]', roles: ['FINANCE_VIEWER'] },
  { label: '[FINANCE_EDITOR]', roles: ['FINANCE_EDITOR'] },
  { label: '[MANAGER]', roles: ['MANAGER'] },
  { label: '[ADMIN]', roles: ['ADMIN'] },
  { label: '[STUDENT]', roles: ['STUDENT'] },
  { label: '[STUDENT, VIEWER]', roles: ['STUDENT', 'VIEWER'] },
  { label: '[] (no roles)', roles: [] },
  { label: '[UNKNOWN_ROLE]', roles: ['UNKNOWN_ROLE'] },
];

const authService = { login, logout, getAuthToken };
export default authService;
