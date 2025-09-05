import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_update_success(
  connection: api.IConnection,
): Promise<void> {
  // Create a taskUser account to establish authentication context
  const joinInfo: IMinimalTodoTaskUser.IJoin = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "taskuser123",
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authorized: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: joinInfo,
    });
  typia.assert(authorized);

  // Create a new task with title
  const createBody = {
    title: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IMinimalTodoTask.ICreate;

  const createdTask: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: createBody,
    });
  typia.assert(createdTask);

  // Update the created task with new title and status change
  const updateBody = {
    title: RandomGenerator.paragraph({ sentences: 5 }),
    status: "complete",
  } satisfies IMinimalTodoTask.IUpdate;

  const updatedTask: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.update(connection, {
      taskId: createdTask.id,
      body: updateBody,
    });
  typia.assert(updatedTask);

  // Validate task update was successful
  TestValidator.equals(
    "Updated task has the expected title",
    updatedTask.title,
    updateBody.title,
  );
  TestValidator.equals(
    "Updated task has the expected status",
    updatedTask.status,
    updateBody.status,
  );
  TestValidator.equals(
    "Updated task ID matches original task ID",
    updatedTask.id,
    createdTask.id,
  );
  TestValidator.predicate(
    "Updated task updated_at is after created_at",
    new Date(updatedTask.updated_at) > new Date(createdTask.created_at),
  );
}
