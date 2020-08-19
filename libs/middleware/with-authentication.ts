import { nSQL } from '@nano-sql/core';
import { UNAUTHORIZED } from 'http-status-codes';
import { decodeJWT } from 'libs/jwt';
import { NextApiRequest } from 'next';
import { parseCookies } from 'nookies';
import { NextHttpHandler, User } from 'types';

function extractTokenFromCookies(req: NextApiRequest) {
  const cookies = parseCookies({ req });

  return cookies.token;
}

function extractTokenFromHeaders(req: NextApiRequest) {
  const bearerRegex = /Bearer (.*)/;
  const { authorization } = req.headers;

  if (!authorization || !bearerRegex.test(authorization)) return;

  const [, token] = bearerRegex.exec(authorization);

  return token;
}

function isJSON(json: string, encoding: BufferEncoding = 'binary'): boolean {
  try {
    JSON.parse(
      Buffer.from(
        json.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString(encoding),
    );
    return true;
  } catch {
    return false;
  }
}

function isJWT(token: string): boolean {
  const urlSafeBase64 = /^[A-Z0-9_-]+$/i;

  if (typeof token !== 'string') return;

  const parts = token.split('.');

  if (parts.length !== 3) return false;
  if (
    !urlSafeBase64.test(parts[0]) &&
    !urlSafeBase64.test(parts[1]) &&
    !urlSafeBase64.test(parts[2])
  )
    return false;
  if (!(isJSON(parts[0]) && isJSON(parts[1], 'utf-8'))) return false;

  return true;
}

export function withAuthentication(handler: NextHttpHandler): NextHttpHandler {
  return async (req, res) => {
    const token = extractTokenFromCookies(req) ?? extractTokenFromHeaders(req);

    if (!isJWT(token))
      return res.status(UNAUTHORIZED).json({
        statusCode: UNAUTHORIZED,
        message: 'Missing or invalid authorization token',
      });

    try {
      const payload = decodeJWT(token);
      const [user] = (await nSQL('users')
        .query('select', [
          'id',
          'firstName',
          'lastName',
          'username',
          'picture',
          'bio',
        ])
        .where(['id', '=', payload.sub])
        .exec()) as User[];

      if (!user)
        return res.status(UNAUTHORIZED).json({
          statusCode: UNAUTHORIZED,
          message: 'Invalid user from token',
        });

      req.user = user;

      return handler(req, res);
    } catch {
      res.status(UNAUTHORIZED).json({
        statusCode: UNAUTHORIZED,
        message: 'Invalid authorization JWT',
      });
    }
  };
}
