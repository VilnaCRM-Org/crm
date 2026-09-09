import { seedFaker } from '@tests/builders/seed';
import { installConsoleGate } from '@tests/console-gate/install';

seedFaker();
installConsoleGate({ failOnWarn: false });
