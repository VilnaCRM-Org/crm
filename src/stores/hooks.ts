import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

import { AppDispatch, type RootState } from '@/stores';

const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();

export default useAppDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
