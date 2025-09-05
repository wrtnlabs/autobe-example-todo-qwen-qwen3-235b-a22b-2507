import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_detail_not_found(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create new user and authenticate
  // Email is valid email format, password meets minimum 8 characters with letters and numbers
  const joinInput = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "testpass123",
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authorizedUser: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: joinInput,
    });
  typia.assert(authorizedUser);

  // 2. Generate non-existent task ID using valid UUID format
  const nonExistentTaskId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Attempt to retrieve non-existent task and verify 404 Not Found error
  // This tests the business rule that accessing a non-existent task returns a proper not found error
  await TestValidator.httpError(
    "Accessing non-existent task should return 404 Not Found",
    404,
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.detail(connection, {
        taskId: nonExistentTaskId,
      });
    },
  );
}
