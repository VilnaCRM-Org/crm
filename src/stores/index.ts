import { configureStore } from '@reduxjs/toolkit';

import AuthReducer from '@/modules/User/store/index';

export default configureStore({
  reducer: {
    Auth: AuthReducer,
  }
});
