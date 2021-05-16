import { MethodNotAllowedError, NextHttpHandler } from '@app/types';

export function validateMethod(methods: string[]) {
  return (handler: NextHttpHandler): NextHttpHandler =>
    (req, res) => {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));

        throw new MethodNotAllowedError(methods);
      } else return handler(req, res);
    };
}
