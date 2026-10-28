import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;

  if (typeof window !== 'undefined' && !headers.has('Authorization')) {
    const token = localStorage.getItem('devflow_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const cloned = req.clone({
    headers,
    withCredentials: true,
  });

  return next(cloned);
};
