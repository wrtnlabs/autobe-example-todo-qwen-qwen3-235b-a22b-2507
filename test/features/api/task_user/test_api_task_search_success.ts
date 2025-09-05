import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import type { IPageIMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIMinimalTodoTask";

export async function test_api_task_search_success(
  connection: api.IConnection,
): Promise<void> {
  // Create a new user account and authenticate using the join operation
  const email = typia.random<string & typia.tags.Format<"email">>();
  const password = "Test123!";

  const auth = await api.functional.auth.taskUser.join(connection, {
    body: {
      email,
      password,
    } satisfies IMinimalTodoTaskUser.IJoin,
  });
  typia.assert(auth);

  // Create multiple tasks with different titles
  const importantTask = await api.functional.minimalTodo.taskUser.tasks.create(
    connection,
    {
      body: {
        title: "Important Task",
      } satisfies IMinimalTodoTask.ICreate,
    },
  );
  typia.assert(importantTask);

  const meetingTask = await api.functional.minimalTodo.taskUser.tasks.create(
    connection,
    {
      body: {
        title: "Team Meeting Notes",
      } satisfies IMinimalTodoTask.ICreate,
    },
  );
  typia.assert(meetingTask);
}
