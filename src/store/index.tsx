import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './authSlice'; // ✅ import the new auth slice

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice, // ✅ add it here
});

export default configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof rootReducer>;
