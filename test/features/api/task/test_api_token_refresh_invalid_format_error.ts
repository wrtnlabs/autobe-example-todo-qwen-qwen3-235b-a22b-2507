import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

/**
 * Validates token refresh failure due to invalid refresh token format.
 *
 * This test ensures the system properly validates refresh token format
 * before processing, rejecting tokens that don't meet the required criteria
 * of at least 22 alphanumeric characters, hyphens, underscores, or equals
 * signs. The validation occurs early in the authentication flow to prevent
 * processing of obviously malformed tokens, enhancing security by catching
 * format issues before deeper validation or database queries.
 *
 * The test follows a complete user journey:
 *
 * 1. Creates a task user account to establish authentication context
 * 2. Attempts token refresh with various invalid formats
 * 3. Verifies appropriate error responses for each invalid case
 * 4. Confirms the original authentication state remains intact
 *
 * Testing format validation at the API level ensures malicious or malformed
 * tokens are rejected immediately, reducing server load and preventing
 * potential security issues from propagating through the authentication
 * system.
 */
export async function test_api_token_refresh_invalid_format_error(
  connection: api.IConnection,
): Promise<void> {
  // Create a task user account first to establish authentication context
  // This is required as per the dependencies to have a valid user session
  const email = typia.random<string & tags.Format<"email">>();
  const joinInfo = {
    email: email,
    password: typia.random<string & tags.MinLength<8> & tags.MaxLength<64>>(),
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authorized = await api.functional.auth.taskUser.join(connection, {
    body: joinInfo,
  });
  typia.assert<IMinimalTodoTaskUser.IAuthorized>(authorized);

  // Store the original connection headers to verify they don't change after failed refresh attempts
  const originalHeaders = { ...connection.headers };

  // Test refresh with invalid format tokens
  // The system should validate format before processing and return appropriate errors

  // Case 1: Token is too short (less than 22 characters)
  // This tests the minimum length requirement for security
  const invalidShortToken = "short123";
  await TestValidator.error(
    "should fail when refresh token is too short (minimum 22 characters required)",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken: invalidShortToken,
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );

  // Verify connection headers (authentication state) remain unchanged after failed refresh
  TestValidator.equals(
    "connection headers should remain unchanged after failed refresh",
    connection.headers,
    originalHeaders,
  );

  // Case 2: Token contains disallowed special characters
  // Tests validation of character set (only alphanumeric, hyphens, underscores, equals)
  const invalidSpecialCharsToken = "validchars123!@#$%";
  await TestValidator.error(
    "should fail when refresh token contains disallowed special characters (!@#$%)",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken: invalidSpecialCharsToken,
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );

  // Case 3: Empty string token
  // Tests validation of non-empty requirement
  await TestValidator.error(
    "should fail when refresh token is empty string",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken: "",
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );

  // Case 4: Token with only whitespace
  // Tests validation that trims and checks for meaningful content
  await TestValidator.error(
    "should fail when refresh token contains only whitespace",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken: "   ",
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );

  // Case 5: Null token value
  // Tests proper handling of null input
  await TestValidator.error(
    "should fail when refresh token is null",
    async () => {
      const invalidRequest = {
        body: {
          refreshToken: null!,
        },
      };
      await api.functional.auth.taskUser.refresh(
        connection,
        invalidRequest as any,
      );
    },
  );

  // Case 6: Undefined token value
  // Tests proper handling of undefined input
  await TestValidator.error(
    "should fail when refresh token is undefined",
    async () => {
      const invalidRequest = {
        body: {
          refreshToken: undefined!,
        },
      };
      await api.functional.auth.taskUser.refresh(
        connection,
        invalidRequest as any,
      );
    },
  );

  // Verify the original valid token still works after failed refresh attempts
  // This ensures failed refresh attempts don't invalidate the current session
  const revalidated = await api.functional.auth.taskUser.refresh(connection, {
    body: {
      refreshToken: authorized.token.refresh,
    } satisfies IMinimalTodoTaskUser.IRefresh,
  });
  typia.assert<IMinimalTodoTaskUser.IAuthorized>(revalidated);
}
