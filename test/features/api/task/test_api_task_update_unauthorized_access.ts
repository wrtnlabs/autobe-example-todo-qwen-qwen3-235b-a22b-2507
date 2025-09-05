import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_update_unauthorized_access(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create first user (user1) with taskUser role
  const user1Email: string = typia.random<string & tags.Format<"email">>();
  const user1: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: user1Email,
        password: "password123",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user1);

  // 2. Create a task as user1
  const task: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: {
        title: RandomGenerator.paragraph(),
      } satisfies IMinimalTodoTask.ICreate,
    });
  typia.assert(task);

  // 3. Create second user (user2) with taskUser role
  const user2Email: string = typia.random<string & tags.Format<"email">>();
  const user2: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: user2Email,
        password: "password123",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user2);

  // 4. Attempt to update user1's task as user2 (should fail with authorization error)
  await TestValidator.error(
    "unauthorized access should be blocked",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.update(connection, {
        taskId: task.id,
        body: {
          title: "Updated title by unauthorized user",
        } satisfies IMinimalTodoTask.IUpdate,
      });
    },
  );
}
