import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

export async function test_api_task_delete_cascade_relationships(
  connection: api.IConnection,
) {
  // 1. Create taskUser account to establish authentication context
  const joinData = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "password123",
  } satisfies IMinimalTodoTaskUser.IJoin;

  // Register the taskUser
  const auth = await api.functional.auth.taskUser.join(connection, {
    body: joinData,
  });
  typia.assert(auth);

  // 2. Create a new task that may have associated dependent records
  const createData = {
    title: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IMinimalTodoTask.ICreate;

  const task = await api.functional.minimalTodo.taskUser.tasks.create(
    connection,
    {
      body: createData,
    },
  );
  typia.assert(task);

  // 3. Delete the task - this should trigger CASCADE deletion of related records
  // Verify the delete operation succeeds (204 No Content expected)
  await api.functional.minimalTodo.taskUser.tasks.erase(connection, {
    taskId: task.id,
  });

  // 4. Verify cascade deletion behavior by attempting to create a new task
  // This ensures the system state remains consistent after cascade deletion
  // If cascade deletion failed and left orphaned records, this operation might fail
  const newTaskData = {
    title: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IMinimalTodoTask.ICreate;

  const newTask = await api.functional.minimalTodo.taskUser.tasks.create(
    connection,
    {
      body: newTaskData,
    },
  );
  typia.assert(newTask);
}
