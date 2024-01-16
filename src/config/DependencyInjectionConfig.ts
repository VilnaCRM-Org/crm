import 'reflect-metadata';
import { container } from 'tsyringe';

import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.register<HttpsClient>('HttpsClient', { useClass: FetchHttpsClient });
