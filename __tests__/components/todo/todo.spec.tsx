import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Todo from 'components/todo';
import faker from 'faker';
import React from 'react';
import server from 'utils/test-server';
import { respondWithServiceUnavailable } from 'utils/test-server/handlers/handle-with-error';

describe('<Todo />', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  it('should render', () => {
    expect(render(<Todo />)).toBeDefined();
  });

  it('should show error message', async () => {
    server.use(respondWithServiceUnavailable('/api/todos', 'get')); // Make the request fails due a DB connection error
    render(<Todo />);

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
      'Database connection error',
    ); // Check the error message is showed
  });

  it('should list the todos', async () => {
    render(<Todo />);

    await waitForElementToBeRemoved(screen.getByTestId('loading-todos')); // Wait until loader to disappear

    expect(
      screen.getByRole('list', { name: 'List of todo' }).children,
    ).toHaveLength(10); // Check all todos are listed, by default 10
  });

  it('should create a new todo and add to list', async () => {
    const text = faker.lorem.words();
    render(<Todo />);

    await waitForElementToBeRemoved(screen.getByTestId('loading-todos')); // Wait until loader to disappear

    await userEvent.type(screen.getByRole('textbox', { name: /Text/ }), text); // Typing the new todo
    userEvent.click(screen.getByRole('button', { name: /Add/i })); // Submit the form

    await screen.findByTestId('loading-todos'); // Wait until loader appear
    await waitForElementToBeRemoved(screen.getByTestId('loading-todos')); // Then, wait until loader to disappear

    expect(screen.getByText(text)).toBeInTheDocument(); // Find the new todo in the list
  });
});
