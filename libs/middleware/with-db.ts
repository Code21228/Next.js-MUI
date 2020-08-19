import { nSQL } from '@nano-sql/core';
import { SERVICE_UNAVAILABLE } from 'http-status-codes';
import { dbConfig, todos, users } from 'libs/db';
import { NextHttpHandler } from 'types';

export function withDB(handler: NextHttpHandler): NextHttpHandler {
  return async (req, res) => {
    try {
      if (!nSQL().listDatabases().includes(dbConfig.id)) {
        await nSQL().createDatabase(dbConfig);
        await nSQL('users').loadJS(users);
        await nSQL('todos').loadJS(todos);
        await nSQL('todos').query('rebuild search').exec();
      }

      return handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(SERVICE_UNAVAILABLE).json({
        statusCode: SERVICE_UNAVAILABLE,
        message: 'Database connection error',
      });
    }
  };
}
