import 'reflect-metadata';

import { container } from 'tsyringe';

import runtimeConfigRegistrar from '@/config/runtime/di';
import type { ModuleRegistrar } from '@/config/types/module-registrar';
import userModuleRegistrar from '@/modules/user/config/di';
import errorRegistrar from '@/services/error/di';
import errorReportingRegistrar from '@/services/error-reporting/di';
import httpClientRegistrar from '@/services/https-client/di';
import localeFormatterRegistrar from '@/services/locale-formatter/di';
import observabilityRegistrar from '@/services/observability/di';
import errorUtilsRegistrar from '@/utils/error/di';

const registrars: ModuleRegistrar[] = [
  runtimeConfigRegistrar,
  errorUtilsRegistrar,
  errorRegistrar,
  errorReportingRegistrar,
  httpClientRegistrar,
  localeFormatterRegistrar,
  observabilityRegistrar,
  userModuleRegistrar,
];

registrars.forEach((registrar) => registrar.register(container));

export default container;
