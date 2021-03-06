import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { take } from 'rxjs/operators';

import {
  AppAlertDescriptor,
  AppAlertsService,
} from '@app/services/app-alerts.service';
import { SessionService } from '@app/services/session.service';

import { HttpErrorService } from './httperror.service';

function setup() {
  spyOn(console, 'error');

  const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const appAlertService = new AppAlertsService();
  const sessionService = new SessionService();

  const httpErrorService = new HttpErrorService(
    routerSpy,
    appAlertService,
    sessionService,
  );

  return {
    routerSpy,
    appAlertService,
    sessionService,

    httpErrorService,
  };
}

describe('HttpErrorService', () => {
  beforeEach(() => {
    localStorage.removeItem('session-service:sessionToken');
  });

  it('should handle HttpErrorResponses', async () => {
    const { httpErrorService, appAlertService } = setup();

    const emitPromise = new Promise<AppAlertDescriptor>(resolve => {
      appAlertService.appAlertDescriptor$.pipe(take(1)).subscribe({
        next: event => {
          resolve(event);
        },
      });
    });

    const response = new HttpErrorResponse({
      status: 400,
    });
    httpErrorService.handleError(response);

    await expectAsync(emitPromise).toBeResolvedTo(
      jasmine.objectContaining({
        text: jasmine.any(String),
        type: 'danger',
        canClose: true,
        autoCloseInterval: 5000,
      }),
    );
  });

  it('should handle "no response" HttpErrorResponses', async () => {
    const { httpErrorService, appAlertService } = setup();
    const response = new HttpErrorResponse({
      status: 0,
    });

    const emitPromise = new Promise<AppAlertDescriptor>(resolve => {
      appAlertService.appAlertDescriptor$.pipe(take(1)).subscribe({
        next: event => {
          resolve(event);
        },
      });
    });

    httpErrorService.handleError(response);
    await expectAsync(emitPromise).toBeResolvedTo({
      autoCloseInterval: 5000,
      canClose: true,
      text: 'Unable to connect to server',
      type: 'danger',
    });
  });

  it('should handle "session expired" HttpErrorResponses', async () => {
    const { httpErrorService, appAlertService, routerSpy } = setup();
    const response = new HttpErrorResponse({
      status: 401,
    });

    const emitPromise = new Promise<AppAlertDescriptor>(resolve => {
      appAlertService.appAlertDescriptor$.pipe(take(1)).subscribe({
        next: event => {
          resolve(event);
        },
      });
    });

    httpErrorService.handleError(response);

    await expectAsync(emitPromise).toBeResolvedTo({
      autoCloseInterval: 5000,
      canClose: true,
      text: 'Session expired',
      type: 'danger',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle arbitrary errors', async () => {
    const { httpErrorService, appAlertService } = setup();

    const emitPromise = new Promise<AppAlertDescriptor>(resolve => {
      appAlertService.appAlertDescriptor$.pipe(take(1)).subscribe({
        next: event => {
          resolve(event);
        },
      });
    });

    httpErrorService.handleError('something');

    await expectAsync(emitPromise).toBeResolvedTo(
      jasmine.objectContaining({
        text: jasmine.any(String),
        type: 'danger',
        canClose: true,
        autoCloseInterval: 5000,
      }),
    );
  });
});
