import { container } from 'tsyringe';

import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.registerSingleton<HttpsClient>('HttpsClient', FetchHttpsClient);

container.registerSingleton<RegistrationAPI>('RegistrationAPI', RegistrationAPI);
container.registerSingleton<LoginAPI>('LoginAPI', LoginAPI);

export default container;
