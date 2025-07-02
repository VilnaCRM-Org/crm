import { configureStore } from '@reduxjs/toolkit';

import AuthReducer from '../modules/User/store';

export default configureStore({
  reducer: {
    Auth: AuthReducer,
  },
});
