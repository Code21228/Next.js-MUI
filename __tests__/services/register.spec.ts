import { STATUS_CODES } from 'http';

import register from 'services/register';

/* global fetchMock */
describe('login', () => {
  it('should allow to send credentials', async () => {
    fetchMock.mockResponseOnce(`{
  "id": "760add88-0a2b-4358-bc3f-7d82245c5dea",
  "username": "kristen.williams",
  "firstName": "Kristen",
  "lastName": "Williams",
  "picture": "https://i.pravatar.cc/200",
  "bio": "Lorem ipsum dolorem"
}`);
    const body = {
      firstName: 'Kristen',
      lastName: 'Williams',
      username: 'kristen.williams',
      password: 'Pa$$w0rd!',
    };

    await expect(register(body)).resolves.toMatchObject({
      id: expect.any(String),
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      picture: expect.any(String),
      bio: expect.any(String),
    });
  });

  it('should fail for duplicate user', async () => {
    fetchMock.mockResponse(
      `{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Username or Email already registered"
}`,
      { status: 409 },
    );
    const body = {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane_doe',
      password: 'Pa$$w0rd!',
    };

    await expect(register(body)).rejects.toThrow(
      'Username or Email already registered',
    );
  });

  it('should fail for validation error', async () => {
    fetchMock.mockResponseOnce(
      `{
  "statusCode": 422,
  "message": "Unprocessable Entity",
  "errors": {
    "firstName": "First name is a required field",
    "lastName": "Last name is a required field",
    "username": "Username must be at least 5 characters",
    "password": "Password must be at least 8 characters"
  }
}`,
      { status: 422 },
    );
    const body = {
      firstName: '',
      lastName: null,
      username: 'jane',
      password: 'pwd',
    };

    await expect(register(body)).rejects.toThrow(/required field/);
  });

  it('should fail for server error', async () => {
    fetchMock.mockResponseOnce(
      `{
  "statusCode": 500,
  "error": "Server Error"
}`,
      { status: 500 },
    );

    const body = {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'jane_doe',
      password: 'Pa$$w0rd!',
    };

    await expect(register(body)).rejects.toThrow(STATUS_CODES[500]);
  });
});
