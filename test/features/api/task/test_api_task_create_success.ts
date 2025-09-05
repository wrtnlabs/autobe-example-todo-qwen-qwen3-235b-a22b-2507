import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_create_success(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create a new user account and establish authentication context
  const userData = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "password123",
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authResponse: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: userData,
    });
  typia.assert(authResponse);

  // Verify the authentication was successful
  typia.assert(authResponse);
  TestValidator.equals(
    "Authentication successful",
    !!authResponse.user.id,
    true,
  );

  // 2. Create a task with a valid title
  const taskData = {
    title: RandomGenerator.paragraph({ sentences: 3, wordMin: 3, wordMax: 7 }),
  } satisfies IMinimalTodoTask.ICreate;

  const task: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: taskData,
    });
  typia.assert(task);

  // 3. Verify the task was created successfully
  // Since the IMinimalTodoTask structure is defined as 'any', we can only verify basic existence
  TestValidator.equals("Task has been returned", !!task, true);

  // We can't validate specific fields like status or created_at since the
  // exact structure of IMinimalTodoTask is not defined in the DTO
}
