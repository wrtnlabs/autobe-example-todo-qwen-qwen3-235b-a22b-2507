import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_update_nonexistent_task(
  connection: api.IConnection,
) {
  // Join as taskUser to establish authentication
  // Using a proper password that meets complexity requirements (8+ characters with letters and numbers)
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "password123", // Meets minimum 8 characters with letters and numbers
  } satisfies IMinimalTodoTaskUser.IJoin;

  const user: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: joinBody,
    });
  typia.assert(user);

  // Generate a valid UUID format for non-existent task
  const taskId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // Attempt to update non-existent task and verify appropriate error response
  // Using await with TestValidator.error since we're testing an async function
  await TestValidator.error(
    "Updating non-existent task should return not-found error", // More descriptive error message
    async () => {
      // Create update body with valid data
      const updateBody = {
        title: RandomGenerator.paragraph({ sentences: 3 }),
        status: typia.random<"incomplete" | "complete">(),
      } satisfies IMinimalTodoTask.IUpdate;

      // Attempt to update with non-existent task ID
      await api.functional.minimalTodo.taskUser.tasks.update(connection, {
        taskId,
        body: updateBody,
      });
    },
  );
}
