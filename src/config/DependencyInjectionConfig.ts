import { container } from 'tsyringe';

import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.registerSingleton<HttpsClient>('HttpsClient', FetchHttpsClient);
