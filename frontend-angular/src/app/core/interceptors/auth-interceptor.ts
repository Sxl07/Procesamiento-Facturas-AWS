import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = sessionStorage.getItem('access_token');

  if (!accessToken) {
    return next(req);
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(req.url);
  const isS3UploadRequest = isAbsoluteUrl && req.method.toUpperCase() === 'PUT';

  if (isS3UploadRequest) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authenticatedRequest);
};