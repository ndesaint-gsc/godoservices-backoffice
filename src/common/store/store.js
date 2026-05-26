import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@/common/features/auth/authSlice';
import customerReducer from '@/common/features/customer/customerSlice';

const PERSIST_KEY = 'bck-root';

const appReducer = combineReducers({
  auth: authReducer,
  customer: customerReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout/fulfilled') {
    storage.removeItem(`persist:${PERSIST_KEY}`);
    state = undefined;
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: PERSIST_KEY,
  storage,
  whitelist: ['auth', 'customer'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export default store;
