import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_delete_success(
  connection: api.IConnection,
): Promise<void> {
  // Step 1: Create user account
  const joinEmail: string = typia.random<string & tags.Format<"email">>();
  const joinPassword: string = "test1234";

  const joinBody = {
    email: joinEmail,
    password: joinPassword,
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authorized: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: joinBody,
    });
  typia.assert(authorized);

  TestValidator.equals(
    "Authorization email matches",
    authorized.user.email,
    joinEmail,
  );

  // Step 2: Create task
  const taskTitle: string = RandomGenerator.paragraph({ sentences: 3 });

  const createBody = {
    title: taskTitle,
  } satisfies IMinimalTodoTask.ICreate;

  const createdTask: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: createBody,
    });
  typia.assert(createdTask);

  TestValidator.equals(
    "Created task title matches",
    createdTask.title,
    taskTitle,
  );
  TestValidator.predicate(
    "Created task has valid ID",
    () => typeof createdTask.id === "string" && createdTask.id.length > 0,
  );

  // Step 3: Delete task
  await api.functional.minimalTodo.taskUser.tasks.erase(connection, {
    taskId: createdTask.id,
  });
}
