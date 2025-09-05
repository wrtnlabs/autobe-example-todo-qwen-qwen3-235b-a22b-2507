import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_create_title_too_long(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create a new user account and authenticate using join operation
  const joinEmail: string = typia.random<string & tags.Format<"email">>();
  const password: string = RandomGenerator.alphaNumeric(8);

  const joined: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: joinEmail,
        password: password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(joined);
  TestValidator.equals(
    "User should be properly authenticated",
    !!joined.user,
    true,
  );

  // 2. Attempt to create a task with title exceeding 100 characters
  // Create a title that is guaranteed to exceed 100 characters
  const longTitle: string = "x".repeat(101);

  await TestValidator.error(
    "Task creation should fail when title exceeds 100 characters with proper validation error",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.create(connection, {
        body: {
          title: longTitle,
        } satisfies IMinimalTodoTask.ICreate,
      });
    },
  );
}
