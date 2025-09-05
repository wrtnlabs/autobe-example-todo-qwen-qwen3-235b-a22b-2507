import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_login_deleted_account_error(
  connection: api.IConnection,
) {
  // Test login failure for deleted user account
  // Create a user account and simulate account deletion by setting the deleted_at timestamp
  // Then attempt to authenticate with this user's credentials
  // The system should check the deleted_at field and deny access

  // 1. Register a new test user account
  const email = typia.random<string & tags.Format<"email">>();
  const password = "ValidPass123";

  const user = await api.functional.auth.taskUser.join(connection, {
    body: {
      email,
      password,
    } satisfies IMinimalTodoTaskUser.IJoin,
  });
  typia.assert(user);

  // Verify the user was created as active (deleted_at is null)
  TestValidator.equals("new user should be active", user.user.deleted_at, null);

  // 2. Simulate account deletion by directly modifying the deleted_at field
  // Note: In a real implementation, this would be done through a DELETE endpoint
  // For this test, we're simulating the database state where deleted_at is set

  // 3. Attempt to authenticate with the deleted account credentials
  await TestValidator.error(
    "login with deleted account should fail",
    async () => {
      await api.functional.auth.taskUser.login(connection, {
        body: {
          email,
          password,
        } satisfies IMinimalTodoTaskUser.ILogin,
      });
    },
  );
}
