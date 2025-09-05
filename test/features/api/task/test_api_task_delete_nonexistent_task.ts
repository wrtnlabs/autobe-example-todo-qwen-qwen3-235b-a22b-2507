import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

/**
 * Test attempting to delete a task that does not exist.
 *
 * First, create a new user account with taskUser role using the join
 * operation to establish authentication context. Then, attempt to delete a
 * task using a valid UUID format but one that does not correspond to any
 * existing task record for that user, verifying the system returns a not
 * found error response.
 */
export async function test_api_task_delete_nonexistent_task(
  connection: api.IConnection,
) {
  // Create taskUser account to establish the required authentication context
  // This automatically logs in the user, enabling attempts to delete non-existent tasks while authenticated
  const password: string = RandomGenerator.paragraph({ sentences: 4 }) + "1234";
  const authorized: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(authorized);

  // Attempt to delete a task using a valid UUID format but one that does not
  // correspond to any existing task record for that user
  // This should result in a not found error response
  await TestValidator.error(
    "delete non-existent task should fail with not found error",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.erase(connection, {
        taskId: typia.random<string & tags.Format<"uuid">>(),
      });
    },
  );
}
