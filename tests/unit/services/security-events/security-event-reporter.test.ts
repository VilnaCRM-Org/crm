import 'reflect-metadata';

import securityEventCore from '@/services/security-events/security-event-core';
import SecurityEventReporter from '@/services/security-events/security-event-reporter';

describe('SecurityEventReporter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates auth failures to the container-free core', () => {
    const authFailure = jest.spyOn(securityEventCore, 'authFailure').mockImplementation();

    new SecurityEventReporter().authFailure('login', 'network');

    expect(authFailure).toHaveBeenCalledWith('login', 'network');
  });

  it('delegates unauthorized responses to the container-free core', () => {
    const unauthorized = jest.spyOn(securityEventCore, 'unauthorizedResponse').mockImplementation();

    new SecurityEventReporter().unauthorizedResponse(401);

    expect(unauthorized).toHaveBeenCalledWith(401);
  });

  it('delegates boundary catches to the container-free core', () => {
    const boundaryCatch = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();

    new SecurityEventReporter().boundaryCatch('app');

    expect(boundaryCatch).toHaveBeenCalledWith('app');
  });
});
