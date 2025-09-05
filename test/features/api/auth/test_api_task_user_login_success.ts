import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_login_success(
  connection: api.IConnection,
) {
  // Create user credentials for the test
  const email = typia.random<string & tags.Format<"email">>();
  const password = "password123";

  // Step 1: Create a new user account via join operation
  // This establishes the user in the minimal_todo_taskusers table with hashed password
  const joinOutput: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(joinOutput);

  // Validate the join response contains complete user and token information
  TestValidator.equals(
    "join response should contain user data",
    !!joinOutput.user,
    true,
  );
  TestValidator.equals(
    "join response should contain authorization tokens",
    !!joinOutput.token,
    true,
  );

  // Verify user account is active (not deleted)
  TestValidator.equals(
    "newly created user should not be marked as deleted",
    joinOutput.user.deleted_at,
    null,
  );

  // Step 2: Authenticate the existing user with valid credentials
  // This verifies the password hash against stored value and creates a session
  const loginOutput: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.login(connection, {
      body: {
        email,
        password,
      } satisfies IMinimalTodoTaskUser.ILogin,
    });
  typia.assert(loginOutput);

  // Step 3: Validate successful authentication and session creation
  // The system should create a session with 30-day expiration in minimal_todo_sessions table

  // Verify the response contains the authorized user information
  TestValidator.equals(
    "login response should contain user data",
    !!loginOutput.user,
    true,
  );

  // Verify authentication tokens are provided
  TestValidator.equals(
    "login response should contain authorization tokens",
    !!loginOutput.token,
    true,
  );

  // Validate access token is present (used for subsequent API requests)
  TestValidator.equals(
    "access token should be present in response",
    !!loginOutput.token.access,
    true,
  );

  // Validate refresh token is present (used for token renewal)
  TestValidator.equals(
    "refresh token should be present in response",
    !!loginOutput.token.refresh,
    true,
  );

  // Verify token expiration timestamps are set (implementing 30-day validity)
  TestValidator.predicate(
    "access token expiration should be set",
    !!loginOutput.token.expired_at,
  );
  TestValidator.predicate(
    "refresh token expiration should be set",
    !!loginOutput.token.refreshable_until,
  );

  // Step 4: Validate data consistency across authentication flow

  // Verify user identity remains consistent between join and login
  TestValidator.equals(
    "user ID should remain consistent across authentication",
    loginOutput.user.id,
    joinOutput.user.id,
  );

  // Verify user email remains consistent
  TestValidator.equals(
    "user email should remain consistent across authentication",
    loginOutput.user.email,
    joinOutput.user.email,
  );

  // Final verification that user account remains active after login
  TestValidator.equals(
    "authenticated user should not be marked as deleted",
    loginOutput.user.deleted_at,
    null,
  );
}
