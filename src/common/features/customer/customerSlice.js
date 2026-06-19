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
      const evUser = action.payload?.evUser || {};
      state.guid = evUser.guid || null;
      state.displayName = evUser.display_name || null;
      state.email = evUser.email_address || null;
      state.brand = evUser.brand || null;
      state.raw = action.payload || null;
    },
    // Merge just-saved evUser fields into the stored customer so the store (and the
    // persisted copy) reflect the save deterministically — no refetch race.
    // payload: { fieldName: value, ... }
    patchEvUser: (state, action) => {
      if (!state.raw) return;
      const evUser = { ...(state.raw.evUser || {}), ...action.payload };
      state.raw = { ...state.raw, evUser };
      if ('display_name' in action.payload) state.displayName = evUser.display_name || null;
      if ('email_address' in action.payload) state.email = evUser.email_address || null;
      if ('brand' in action.payload) state.brand = evUser.brand || null;
    },
    clearCustomer: () => initialState,
  },
});

export const { setCustomer, patchEvUser, clearCustomer } = customerSlice.actions;

export const selectCustomer = (state) => state.customer;
export const selectHasCustomer = (state) => Boolean(state.customer?.guid);

export default customerSlice.reducer;
