import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  guid: null,
  displayName: null,
  email: null,
  brand: null,
  raw: null,
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setCustomer: (state, action) => {
      const u = action.payload?.evUser || {};
      state.guid = u.guid || null;
      state.displayName = u.display_name || null;
      state.email = u.email_address || null;
      state.brand = u.brand || null;
      state.raw = action.payload || null;
    },
    clearCustomer: () => initialState,
  },
});

export const { setCustomer, clearCustomer } = customerSlice.actions;

export const selectCustomer = (s) => s.customer;
export const selectHasCustomer = (s) => Boolean(s.customer?.guid);

export default customerSlice.reducer;
