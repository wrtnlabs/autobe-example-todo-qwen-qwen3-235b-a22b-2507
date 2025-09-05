import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";

/**
 * Test attempting to delete a task belonging to another user to verify
 * proper authorization enforcement.
 *
 * This test validates that the system properly enforces authorization rules
 * by preventing users from accessing or modifying tasks that belong to
 * other users. The test follows a complete user journey:
 *
 * 1. Create the first user (user1) with taskUser role
 * 2. Create a task using user1's authentication context
 * 3. Create the second user (user2) with taskUser role
 * 4. Attempt to delete user1's task using user2's authentication context
 * 5. Verify the system blocks this unauthorized access with appropriate error
 *
 * Security Note: This test verifies a critical security boundary that
 * prevents data leakage and maintains user data isolation, which is
 * essential for multi-tenant applications.
 */
export async function test_api_task_delete_unauthorized_access(
  connection: api.IConnection,
) {
  // Create first user (user1) with taskUser role
  // Using a securely formatted email and password meeting complexity requirements
  const userEmail1: string = typia.random<string & tags.Format<"email">>();
  const userPassword1: string = "SecurePass123!"; // Meets requirements: 8+ chars, letters, numbers, special char

  const user1: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: userEmail1,
        password: userPassword1,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user1);

  // Create a task with user1's context
  // Using properly formatted paragraph with object parameters
  const task: IMinimalTodoTask =
    await api.functional.minimalTodo.taskUser.tasks.create(connection, {
      body: {
        title: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 5,
          wordMax: 10,
        }),
      } satisfies IMinimalTodoTask.ICreate,
    });
  typia.assert(task);

  // Verify the task was created successfully and has a valid ID
  TestValidator.predicate(
    "created task should have valid ID",
    task.id !== null && task.id !== undefined && task.id.length > 0,
  );

  // Create second user (user2) with taskUser role to switch authentication context
  const userEmail2: string = typia.random<string & tags.Format<"email">>();
  const userPassword2: string = "SecurePass456!"; // Different secure password for second user

  const user2: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: userEmail2,
        password: userPassword2,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(user2);

  // Verify that we have two distinct users
  TestValidator.notEquals(
    "user1 and user2 should be different accounts",
    user1.user.id,
    user2.user.id,
  );

  // Attempt to delete user1's task with user2's authentication context
  // This should fail due to authorization rules preventing access to other users' tasks
  // Expecting either 403 Forbidden (access denied) or 404 Not Found (to prevent user enumeration)
  await TestValidator.error(
    "user2 should not be able to delete user1\'s task - access should be denied",
    async () => {
      await api.functional.minimalTodo.taskUser.tasks.erase(connection, {
        taskId: task.id,
      });
    },
  );
}
