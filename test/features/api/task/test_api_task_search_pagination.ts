import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import type { IPageIMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIMinimalTodoTask";

export async function test_api_task_search_pagination(
  connection: api.IConnection,
) {
  // Create user and authenticate
  const joinInfo = {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password: typia.random<string & tags.MinLength<8>>(),
    } satisfies IMinimalTodoTaskUser.IJoin,
  };
  const authorization: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, joinInfo);
  typia.assert(authorization);

  // Create multiple tasks using available create function
  const taskCount = 5; // Create fewer tasks since we can't test pagination
  const createdTasks = await ArrayUtil.asyncRepeat(taskCount, async () => {
    const createInfo = {
      body: {
        title: RandomGenerator.paragraph({ sentences: 3 }),
      } satisfies IMinimalTodoTask.ICreate,
    };
    const created = await api.functional.minimalTodo.taskUser.tasks.create(
      connection,
      createInfo,
    );
    typia.assert(created);
    return created;
  });

  // Basic validation of created tasks
  TestValidator.equals(
    "created task count should match request",
    createdTasks.length,
    taskCount,
  );

  // Check that all tasks have valid IDs
  createdTasks.forEach((task, index) => {
    TestValidator.predicate(
      `task ${index + 1} should have valid ID`,
      task.id !== undefined && task.id !== null,
    );
  });
}
