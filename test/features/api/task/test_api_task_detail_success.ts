import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

/**
 * Test successful retrieval of a specific task's details.
 *
 * This test validates the GET /minimalTodo/taskUser/tasks/{taskId} endpoint
 * by:
 *
 * 1. Creating a new user account and authenticating
 * 2. Creating a task to have a valid task ID
 * 3. Retrieving the task details using the task ID
 * 4. Verifying that all task information (title, status, timestamps) is
 *    returned accurately
 *
 * The test follows a complete user journey in the minimalTodo application,
 * ensuring the task detail retrieval functionality works correctly with
 * proper authentication and data consistency.
 */
export async function test_api_task_detail_success(
  connection: api.IConnection,
) {
  // 1. Join scenario to authenticate user
  const joining: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password: "1234",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(joining);

  // 2. Create a task to have a valid task ID for testing retrieval
  const inputTitle = RandomGenerator.paragraph({ sentences: 5 });
  const created: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: {
        title: inputTitle,
      } satisfies IMinimalTodoTask.ICreate,
    });
  typia.assert(created);

  // Verify the created task has the expected title
  TestValidator.equals(
    "created task title should match input",
    created.title,
    inputTitle,
  );

  // 3. Retrieve the specific task's details using its ID
  const retrieved: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.detail(connection, {
      taskId: created.id,
    });
  typia.assert(retrieved);

  // 4. Verify the retrieved task has the same ID as the created task
  TestValidator.equals(
    "retrieved task ID should match created task",
    retrieved.id,
    created.id,
  );

  // 5. Verify the retrieved task has the same title as the created task
  TestValidator.equals(
    "retrieved task title should match",
    retrieved.title,
    created.title,
  );

  // 6. Verify the retrieved task has the same status as the created task
  TestValidator.equals(
    "retrieved task status should match",
    retrieved.status,
    created.status,
  );

  // 7. Verify the retrieved task has the same creation timestamp as the created task
  TestValidator.equals(
    "retrieved task created_at should match",
    retrieved.created_at,
    created.created_at,
  );

  // 8. Verify the retrieved task equals the created task (complete object comparison)
  TestValidator.equals(
    "retrieved task should match created task",
    retrieved,
    created,
  );
}
