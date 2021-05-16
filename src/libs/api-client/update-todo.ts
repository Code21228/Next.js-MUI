import { put } from '@app/libs/request';
import { TodoResponse as Todo, UpdateTodo } from '@app/types';

export default async function updateTodo(
  id: string,
  body: UpdateTodo,
  signal?: AbortSignal,
): Promise<Todo> {
  return put<UpdateTodo, Todo>(`/api/todos/${id}`, body, signal);
}
