import { put } from 'libs/request';
import { TodoResponse as Todo, UpdateTodo } from 'types';

export default async function updateTodo(
  id: string,
  body: UpdateTodo,
): Promise<Todo> {
  return put<UpdateTodo, Todo>(`/api/todos/${id}`, body);
}
