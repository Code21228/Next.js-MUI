import { nSQL } from '@nano-sql/core';
import {
  catchErrors,
  validateMethod,
  withAuthentication,
  withDB,
} from 'src/libs/middleware';
import { NextHttpHandler, UserWithoutPassword as User } from 'src/types';

const findUsers: NextHttpHandler = async (req, res) => {
  const limit = Math.abs(parseInt(req.query.limit as string, 10) || 10);
  const page = Math.abs(parseInt(req.query.page as string, 10) || 1);
  const offset = Math.abs(parseInt(req.query.offset as string, 10) || 0);

  const users = (await nSQL('users')
    .query('select', [
      'id',
      'firstName',
      'lastName',
      'username',
      'picture',
      'bio',
    ])
    .orderBy(['lastName DESC'])
    .limit(limit)
    .offset(offset > 0 ? offset : (page - 1) * limit)
    .exec()) as User[];

  res.json(users);
};

export default catchErrors(
  validateMethod(['GET'])(withDB(withAuthentication(findUsers))),
);
