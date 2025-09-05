import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_create_missing_title(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create a new user account and authenticate
  // This establishes the necessary taskUser role authorization context
  // The join operation must be executed before any operations requiring taskUser role authorization
  const userData = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "test1234",
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authResponse: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: userData,
    });
  typia.assert(authResponse);

  // 2. Attempt to create a task without a title field
  // This tests the validation behavior of the API when a required field is missing
  // The system should reject the request with a validation error since title is required
  await TestValidator.error(
    "task creation should fail when title is missing",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.create(connection, {
        body: {} satisfies IMinimalTodoTask.ICreate,
      });
    },
  );
}
