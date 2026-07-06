import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@/services/auth.service';
import operatorService from '@/services/operator.service';

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  // Rol + permisos resueltos por el backend (…/web-and-console-integrations/auth/me). null = aún no cargados.
  role: null,
  permissions: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login({ email, password });
      return user;
    } catch (err) {
      return rejectWithValue(err?.message || 'Login failed');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

// Carga operador + roles (Evolok directo) + mapa de privilegios (backend por rol).
// roleOverride: solo DEV (el switcher de rol) para previsualizar permisos de cada rol.
export const loadPermissions = createAsyncThunk(
  'auth/loadPermissions',
  async (roleOverride, { rejectWithValue }) => {
    try {
      const { operator, roles } = await operatorService.getOperator(roleOverride);
      const permissions = await operatorService.resolvePermissions(roles);
      return { operator, roles, permissions };
    } catch (err) {
      return rejectWithValue(err?.message || 'No se pudieron cargar los permisos');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRoles: (state, action) => {
      if (state.user) state.user.roles = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
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
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload || action.error?.message || 'Login failed';
      })
      .addCase(loadPermissions.fulfilled, (state, action) => {
        // roles vienen de Evolok (directo); permissions es el mapa fusionado del backend.
        const roles = action.payload?.roles || [];
        state.role = roles[0] || null;
        state.permissions = action.payload?.permissions || null;
        const operator = action.payload?.operator;
        if (operator) {
          state.user = { ...operator, roles };
        } else if (state.user) {
          state.user = { ...state.user, roles };
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.role = null;
        state.permissions = null;
      });
  },
});

export const { setRoles, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
