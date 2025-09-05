import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

/**
 * Validate successful token refresh with valid refresh token.
 *
 * This test verifies that an authenticated user can successfully refresh
 * their authentication session using a valid, non-expired refresh token.
 * The test follows the complete user journey:
 *
 * 1. Creating a new user account
 * 2. Extracting the refresh token from initial authentication
 * 3. Using the refresh token to obtain new authentication tokens
 * 4. Verifying the refresh operation maintains user identity while rotating
 *    tokens
 * 5. Confirming the system extends session validity as expected
 *
 * The test validates that the system correctly:
 *
 * - Locates the corresponding session record in minimal_todo_sessions table
 * - Verifies token validity by comparing current Asia/Seoul time against
 *   expires_at
 * - Issues new access tokens while updating session expiration time
 * - Maintains user identity across token refresh
 * - Implements proper token rotation for security
 *
 * This supports the 30-day session validity business requirement by
 * ensuring users can maintain authenticated state without re-entering
 * primary credentials, while the system securely manages session
 * lifecycle.
 */
export async function test_api_token_refresh_valid_token_success(
  connection: api.IConnection,
): Promise<void> {
  // 1. Create a new user account (prerequisite for refresh token)
  const email: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const password: string = "Typia1234!";

  // Register user and establish initial authentication context
  const authorized: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(authorized);

  // Validate initial authorization response
  TestValidator.equals(
    "created user email matches input email",
    authorized.user.email,
    email,
  );

  // Ensure both access and refresh tokens are issued
  TestValidator.predicate(
    "access token is generated on join",
    authorized.token.access.length > 0,
  );
  TestValidator.predicate(
    "refresh token is generated on join",
    authorized.token.refresh.length > 0,
  );

  // Extract refresh token for refresh operation
  const refreshToken: string = authorized.token.refresh;

  // Store original token timestamps for comparison
  const originalAccessExpires: Date = new Date(authorized.token.expired_at);
  const originalRefreshExpires: Date = new Date(
    authorized.token.refreshable_until,
  );

  // 2. Refresh the session using the valid refresh token
  const refreshed: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.refresh(connection, {
      body: {
        refreshToken,
      } satisfies IMinimalTodoTaskUser.IRefresh,
    });
  typia.assert(refreshed);

  // Validate refresh operation success
  // Verify user identity is preserved across token refresh
  TestValidator.equals(
    "user identity remains unchanged after refresh",
    refreshed.user.id,
    authorized.user.id,
  );
  TestValidator.equals(
    "user email remains unchanged after refresh",
    refreshed.user.email,
    authorized.user.email,
  );

  // Check that new tokens are issued (token rotation)
  TestValidator.predicate(
    "new access token is generated during refresh",
    refreshed.token.access.length > 0,
  );
  TestValidator.predicate(
    "new refresh token is generated during refresh",
    refreshed.token.refresh.length > 0,
  );

  // Verify tokens are actually rotated (different from original)
  TestValidator.notEquals(
    "access token is rotated during refresh",
    refreshed.token.access,
    authorized.token.access,
  );
  TestValidator.notEquals(
    "refresh token is rotated during refresh",
    refreshed.token.refresh,
    authorized.token.refresh,
  );

  // Validate token expiration times (in Asia/Seoul timezone)
  const seoulTimeOffset: number = 9 * 60; // UTC+9 for Asia/Seoul
  const nowSeoul: Date = new Date(
    new Date().getTime() + seoulTimeOffset * 60 * 1000,
  );
  const newAccessExpires: Date = new Date(refreshed.token.expired_at);
  const newRefreshExpires: Date = new Date(refreshed.token.refreshable_until);

  // Ensure new token expiration times are in the future (compared to Asia/Seoul time)
  TestValidator.predicate(
    "new access token expiration is in the future (Asia/Seoul time)",
    newAccessExpires > nowSeoul,
  );
  TestValidator.predicate(
    "new refresh token expiration is in the future (Asia/Seoul time)",
    newRefreshExpires > nowSeoul,
  );

  // Verify that refresh extends token validity (new expiration > original)
  TestValidator.predicate(
    "refresh extends access token validity period",
    newAccessExpires > originalAccessExpires,
  );
  TestValidator.predicate(
    "refresh extends refresh token validity period",
    newRefreshExpires > originalRefreshExpires,
  );

  // Verify updated_at timestamp is updated after refresh
  const originalUpdated: Date = new Date(authorized.user.updated_at);
  const refreshedUpdated: Date = new Date(refreshed.user.updated_at);
  TestValidator.predicate(
    "user updated_at timestamp is updated after refresh",
    refreshedUpdated >= originalUpdated,
  );

  // Verify single-use nature of refresh tokens (security)
  await TestValidator.error(
    "used refresh token cannot be reused (single-use security)",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken,
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );
}
