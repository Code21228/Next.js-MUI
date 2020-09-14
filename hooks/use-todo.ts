import { filterTodoBy } from 'components/todo/filter-todo';
import { createTodo, deleteTodo, listTodo, updateTodo } from 'libs/api-client';
import { CreateTodo, TodoResponse as Todo, UpdateTodo } from 'types';
import { EffectReducer, useEffectReducer } from 'use-effect-reducer';

export type TodoState = {
  loading: boolean;
  all: Todo[];
  completed: Todo[];
  active: Todo[];
  error?: string;
  _todo?: Todo;
  _position?: number;
  _filter: keyof typeof filterTodoBy;
};

type TodoErrorEvent = { type: 'ERROR'; payload: string };
type TodoFetchEvent = { type: 'FETCH_TODOS' };
type TodoFetchSuccessEvent = { type: 'TODOS_FETCHED'; payload: Todo[] };
type TodoAddEvent = { type: 'ADD_TODO'; payload: CreateTodo };
type TodoAddSuccessEvent = { type: 'TODO_SAVED'; payload: Todo };
type TodoUpdateEvent = {
  type: 'EDIT_TODO';
  payload: { id: string; body: UpdateTodo };
};
type TodoUpdateSuccessEvent = { type: 'TODO_CHANGED'; payload: Todo };
type TodoRemoveEvent = {
  type: 'REMOVE_TODO';
  payload: { todo: Todo; position?: number };
};
type TodoRemoveFailEvent = { type: 'REMOVE_TODO_FAILED'; payload: string };
type TodoChangeFilterEvent = {
  type: 'SWITCH_FILTER';
  payload: keyof typeof filterTodoBy;
};
type TodoEvent =
  | TodoErrorEvent
  | TodoFetchEvent
  | TodoFetchSuccessEvent
  | TodoAddEvent
  | TodoAddSuccessEvent
  | TodoUpdateEvent
  | TodoUpdateSuccessEvent
  | TodoRemoveEvent
  | TodoRemoveFailEvent
  | TodoChangeFilterEvent;

type FetchTodosEffect = {
  type: 'fetchTodos';
};
type AddTodoEffect = {
  type: 'addTodo';
  payload: CreateTodo;
};
type EditTodoEffect = {
  type: 'editTodo';
  payload: { id: string; body: UpdateTodo };
};
type RemoveTodoEffect = {
  type: 'removeTodo';
  payload: string;
};
type TodoEffect =
  | FetchTodosEffect
  | AddTodoEffect
  | EditTodoEffect
  | RemoveTodoEffect;

const todoReducer: EffectReducer<TodoState, TodoEvent, TodoEffect> = (
  state,
  event,
  exec,
) => {
  switch (event.type) {
    case 'FETCH_TODOS':
      exec({ type: 'fetchTodos' });
      return {
        ...state,
        loading: true,
      };

    case 'TODOS_FETCHED':
      return {
        ...state,
        loading: false,
        all: event.payload,
        completed: completedSelector(event.payload),
        active: activeSelector(event.payload),
      };

    case 'ADD_TODO':
      exec({ type: 'addTodo', payload: event.payload });
      return {
        ...state,
        loading: true,
        error: undefined,
      };

    case 'TODO_SAVED':
      return {
        ...state,
        loading: false,
        all: [event.payload, ...state.all],
        active: [event.payload, ...state.active],
      };

    case 'EDIT_TODO':
      exec({ type: 'editTodo', payload: event.payload });
      const all = state.all.map(todo =>
        todo.id === event.payload.id
          ? Object.assign(todo, event.payload.body, {
              updatedAt: new Date().toISOString(),
            })
          : todo,
      );
      const completed = completedSelector(all);
      const active = activeSelector(all);
      return {
        ...state,
        error: undefined,
        all,
        completed,
        active,
      };

    case 'TODO_CHANGED':
      event.payload.updatedAt = new Date(event.payload.updatedAt).toISOString(); // Solves an issue
      const _all = state.all.map(todo =>
        todo.id === event.payload.id
          ? Object.assign(todo, event.payload)
          : todo,
      );
      return {
        ...state,
        all: _all,
        completed: event.payload.done
          ? completedSelector(_all)
          : state.completed,
        active: !event.payload.done ? activeSelector(_all) : state.active,
      };

    case 'REMOVE_TODO':
      exec({ type: 'removeTodo', payload: event.payload.todo.id });
      return {
        ...state,
        error: undefined,
        all: state.all.filter(todo => todo.id !== event.payload.todo.id),
        completed: event.payload.todo.done
          ? state.completed.filter(todo => todo.id !== event.payload.todo.id)
          : state.completed,
        active: !event.payload.todo.done
          ? state.active.filter(todo => todo.id !== event.payload.todo.id)
          : state.active,
        _todo: event.payload.todo,
        _position:
          event.payload.position ??
          state.all.findIndex(todo => todo.id === event.payload.todo.id),
      };

    case 'REMOVE_TODO_FAILED':
      return {
        ...state,
        error: event.payload,
        all: state.all.splice(state._position, 0, state._todo),
        completed: [...state.completed, state._todo].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
        active: [...state.active, state._todo].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
        _todo: undefined,
        _position: undefined,
      };

    case 'SWITCH_FILTER':
      return {
        ...state,
        _filter: event.payload,
      };

    case 'ERROR':
      return {
        ...state,
        loading: false,
        error: event.payload,
      };

    default:
      return state;
  }
};
const completedSelector = (todos: Todo[]) => todos.filter(todo => todo.done);
const activeSelector = (todos: Todo[]) => todos.filter(todo => !todo.done);

function errorAction(error: Error): TodoErrorEvent {
  return { type: 'ERROR', payload: error.message };
}
function fetchTodosAction(): FetchTodosEffect {
  return { type: 'fetchTodos' };
}
function fecthTodosSuccessAction(todos: Todo[]): TodoFetchSuccessEvent {
  return { type: 'TODOS_FETCHED', payload: todos };
}
function addTodoAction(newTodo: CreateTodo): TodoAddEvent {
  return { type: 'ADD_TODO', payload: newTodo };
}
function addTodoSuccessAction(todo: Todo): TodoAddSuccessEvent {
  return { type: 'TODO_SAVED', payload: todo };
}
function updateTodoAction(id: Todo['id'], body: UpdateTodo): TodoUpdateEvent {
  return {
    type: 'EDIT_TODO',
    payload: { id, body },
  };
}
function updateTodoSuccessAction(todo: Todo): TodoUpdateSuccessEvent {
  return { type: 'TODO_CHANGED', payload: todo };
}
function removeTodoAction(todo: Todo, position?: number): TodoRemoveEvent {
  return {
    type: 'REMOVE_TODO',
    payload: { todo, position },
  };
}
function removeTodoFailAction(error: Error): TodoRemoveFailEvent {
  return { type: 'REMOVE_TODO_FAILED', payload: error.message };
}
function changeFilterAction(
  filter: keyof typeof filterTodoBy,
): TodoChangeFilterEvent {
  return {
    type: 'SWITCH_FILTER',
    payload: filter,
  };
}

function fetchTodosEffect(
  state: TodoState,
  effect: FetchTodosEffect,
  dispatch: React.Dispatch<TodoEvent>,
) {
  const ctrl = new AbortController();
  listTodo({ signal: ctrl.signal })
    .then(todos => dispatch(fecthTodosSuccessAction(todos)))
    .catch(error => {
      if (!ctrl.signal.aborted) dispatch(errorAction(error));
    });

  return () => ctrl.abort();
}
function addTodoEffect(
  state: TodoState,
  effect: AddTodoEffect,
  dispatch: React.Dispatch<TodoEvent>,
) {
  const ctrl = new AbortController();
  createTodo(effect.payload, ctrl.signal)
    .then(todo => dispatch(addTodoSuccessAction(todo)))
    .catch(error => {
      if (!ctrl.signal.aborted) dispatch(errorAction(error));
    });

  return () => ctrl.abort();
}
function editTodoEffect(
  state: TodoState,
  effect: EditTodoEffect,
  dispatch: React.Dispatch<TodoEvent>,
) {
  const ctrl = new AbortController();
  updateTodo(effect.payload.id, effect.payload.body, ctrl.signal)
    .then(todo => dispatch(updateTodoSuccessAction(todo)))
    .catch(error => {
      if (!ctrl.signal.aborted) dispatch(errorAction(error));
    });

  return () => ctrl.abort();
}
function removeTodoEffect(
  state: TodoState,
  effect: RemoveTodoEffect,
  dispatch: React.Dispatch<TodoEvent>,
) {
  const ctrl = new AbortController();
  deleteTodo(effect.payload, ctrl.signal).catch(error => {
    if (!ctrl.signal.aborted) dispatch(removeTodoFailAction(error));
  });

  return () => ctrl.abort();
}

type TodoAction = {
  addTodo(newTodo: CreateTodo): void;
  changeFilter(filter: keyof typeof filterTodoBy): void;
  removeTodo(todo: Todo, position?: number): void;
  updateTodo(id: Todo['id'], updates: UpdateTodo): void;
};

export function useTodo(): [TodoState, TodoAction] {
  const [state, dispatch] = useEffectReducer(
    todoReducer,
    exec => {
      exec(fetchTodosAction());

      return {
        all: [],
        completed: [],
        active: [],
        loading: true,
        _filter: 'all',
      } as TodoState;
    },
    {
      fetchTodos: fetchTodosEffect,
      addTodo: addTodoEffect,
      editTodo: editTodoEffect,
      removeTodo: removeTodoEffect,
    },
  );

  return [
    state,
    {
      addTodo(newTodo) {
        dispatch(addTodoAction(newTodo));
      },
      changeFilter(filter) {
        dispatch(changeFilterAction(filter));
      },
      removeTodo(todo) {
        dispatch(removeTodoAction(todo));
      },
      updateTodo(id, updates) {
        dispatch(updateTodoAction(id, updates));
      },
    },
  ];
}
