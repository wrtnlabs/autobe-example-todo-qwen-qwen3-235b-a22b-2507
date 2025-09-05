import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_detail_unauthorized_access(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create first user account and authenticate as user1
  const user1Email: string = typia.random<string & tags.Format<"email">>();
  const user1Password: string = "StrongPass123!";
  const user1: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: user1Email,
        password: user1Password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user1);

  // 2. Create a task as user1 to have a task ID for unauthorized access testing
  const task: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: {
        title: RandomGenerator.paragraph(),
      } satisfies IMinimalTodoTask.ICreate,
    });
  typia.assert(task);
  const user1TaskId: string = task.id;

  // 3. Create second user account (user2) to test cross-user access attempt
  const user2Email: string = typia.random<string & tags.Format<"email">>();
  const user2Password: string = "AnotherPass456@";
  const user2: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: user2Email,
        password: user2Password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user2);

  // 4. Attempt to retrieve user1's task details using user2's authentication and verify unauthorized access
  await TestValidator.error(
    "user2 should not be able to access user1's task",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.detail(connection, {
        taskId: user1TaskId,
      });
    },
  );
}
