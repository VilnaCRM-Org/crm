import { useDispatch } from 'react-redux';

import { AppDispatch } from '@/stores';

const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>();

export default useAppDispatch;
