import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ListTodo from '@app/components/todo/list-todo';
import { randomArrayElement } from '@app/utils/factories';
import { todoBuild } from '@app/utils/factories';

describe('<ListTodo />', () => {
  it('should render', () => {
    expect(
      render(
        <ListTodo todos={[]} onChangeTodo={jest.fn} onRemoveTodo={jest.fn} />,
      ),
    ).toBeDefined();
  });

  it('should list todos', () => {
    const spyChangeTodo = jest.fn();
    const spyRemoveTodo = jest.fn();
    const todos = Array.from({ length: 10 }, () =>
      todoBuild({ traits: 'old' }),
    );
    const todo = randomArrayElement(todos);

    render(
      <ListTodo
        todos={todos}
        onChangeTodo={spyChangeTodo}
        onRemoveTodo={spyRemoveTodo}
      />,
    );
    userEvent.click(
      within(
        screen.getByRole('listitem', { name: RegExp(todo.text) }),
      ).getByRole('checkbox'),
    );

    expect(spyChangeTodo).toHaveBeenCalledWith(todo.id, { done: !todo.done });

    userEvent.click(
      screen.getByRole('button', { name: `Delete todo: ${todo.text}` }),
    );

    expect(spyRemoveTodo).toHaveBeenCalledWith(todo, expect.any(Number));
  });
});
