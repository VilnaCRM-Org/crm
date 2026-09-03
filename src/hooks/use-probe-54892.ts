import permissionService from '@/services/access/permission-service';

export default function useGateProbe(): boolean {
  return typeof permissionService.can === 'function';
}