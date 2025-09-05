import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_update_invalid_title_length(
  connection: api.IConnection,
): Promise<void> {
  // Create a new taskUser account with valid credentials
  const email: string = typia.random<string & tags.Format<"email">>();
  const joinOutput: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password: "P@ssw0rd123!",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(joinOutput);

  // Create a new task with a valid title (under 100 characters)
  const validTitle: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 4,
    wordMax: 8,
  });
  const createOutput: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: {
        title: validTitle,
      } satisfies IMinimalTodoTask.ICreate,
    });
  typia.assert(createOutput);

  // Verify the task was created successfully
  TestValidator.equals(
    "created task title matches",
    createOutput.title,
    validTitle,
  );

  // Generate a title exceeding the 100-character limit for validation testing
  const excessiveTitle: string = "x".repeat(101);

  // Verify the test condition - title exceeds the limit
  TestValidator.predicate(
    "excessive title exceeds 100 characters",
    excessiveTitle.length > 100,
  );

  // Attempt to update the task with a title exceeding 100 characters
  // This should fail with a validation error due to the business rule enforcement
  await TestValidator.error(
    "Task update must fail when title exceeds 100 characters",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.update(connection, {
        taskId: createOutput.id,
        body: {
          title: excessiveTitle,
        } satisfies IMinimalTodoTask.IUpdate,
      });
    },
  );
}
