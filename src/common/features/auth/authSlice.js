import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@/services/auth.service';

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
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
      });
  },
});

export const { setRoles, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
