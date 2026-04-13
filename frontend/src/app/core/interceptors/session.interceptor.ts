import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const sessionId = sessionService.getSessionId();

  const modifiedReq = req.clone({
    headers: req.headers.set('X-Session-Id', sessionId)
  });

  return next(modifiedReq);
};
