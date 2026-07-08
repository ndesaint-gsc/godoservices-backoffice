import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { consoleAuthService } from '@/services/console';
import operatorService from '@/services/operator.service';

const EMPTY_PERMISSIONS = { tabs: {}, actions: {}, fields: {} };

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null,
  availableRoles: [],
  role: null,
  permissions: null,
};

// Login real contra Evolok (2 pasos). Devuelve operador + snapshot de sesión.
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { operator, sessionId, guid, groups } = await consoleAuthService.login(email, password);
      return { operator, session: { sessionId, guid, groups } };
    } catch (err) {
      return rejectWithValue(err?.message || 'Login failed');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  consoleAuthService.logout();
});

export const loadPermissions = createAsyncThunk(
  'auth/loadPermissions',
  async (activeRole, { rejectWithValue }) => {
    try {
      const { operator, roles } = await operatorService.getOperator();
      const availableRoles = roles || [];
      const role =
        activeRole && availableRoles.includes(activeRole) ? activeRole : availableRoles[0] || null;
      const permissions = role
        ? await operatorService.resolvePermissions([role])
        : EMPTY_PERMISSIONS;
      return { operator, availableRoles, role, permissions };
    } catch (err) {
      return rejectWithValue(err?.message || 'No se pudieron cargar los permisos');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.operator;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload || action.error?.message || 'Login failed';
      })
      .addCase(loadPermissions.fulfilled, (state, action) => {
        state.availableRoles = action.payload.availableRoles;
        state.role = action.payload.role;
        state.permissions = action.payload.permissions;
        if (action.payload.operator) state.user = action.payload.operator;
      })
      .addCase(logout.fulfilled, (state) => {
        state.role = null;
        state.permissions = null;
        state.session = null;
        state.availableRoles = [];
      });
  },
});

export const { clearUser } = authSlice.actions;
export default authSlice.reducer;
