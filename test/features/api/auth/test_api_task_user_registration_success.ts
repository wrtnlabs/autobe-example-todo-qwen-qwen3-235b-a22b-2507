import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_registration_success(
  connection: api.IConnection,
): Promise<void> {
  // Generate test data
  // Create password with minimum 8 characters containing both letters and numbers
  const email: string = typia.random<string & tags.Format<"email">>();
  const password: string =
    RandomGenerator.alphabets(4) + RandomGenerator.alphaNumeric(4);

  // Create a new user account through the join process
  const authorized = await api.functional.auth.taskUser.join(connection, {
    body: {
      email,
      password,
    } satisfies IMinimalTodoTaskUser.IJoin,
  });
  typia.assert(authorized);

  // Validate response data
  TestValidator.equals(
    "user ID should be valid",
    authorized.user.id.length,
    36,
  ); // UUID length
  TestValidator.equals("user email matches", authorized.user.email, email);

  // Validate timestamps are in correct format and timezone (Asia/Seoul, UTC+9)
  await TestValidator.predicate(
    "created_at should be valid ISO datetime in Asia/Seoul timezone",
    async () => {
      const date = new Date(authorized.user.created_at);
      const timeDiff = date.getTime() + 9 * 60 * 60 * 1000; // Add 9 hours for UTC+9
      const koreaTime = new Date(timeDiff);
      return !isNaN(date.getTime()) && koreaTime.getTimezoneOffset() === -540; // Korea time offset is -540 minutes
    },
  );

  await TestValidator.predicate(
    "updated_at should be valid ISO datetime in Asia/Seoul timezone",
    async () => {
      const date = new Date(authorized.user.updated_at);
      const timeDiff = date.getTime() + 9 * 60 * 60 * 1000; // Add 9 hours for UTC+9
      const koreaTime = new Date(timeDiff);
      return !isNaN(date.getTime()) && koreaTime.getTimezoneOffset() === -540; // Korea time offset is -540 minutes
    },
  );

  // Verify authentication tokens are present and properly formatted
  TestValidator.equals(
    "access token exists and has content",
    authorized.token.access.length > 0,
    true,
  );
  TestValidator.equals(
    "refresh token exists and has content",
    authorized.token.refresh.length > 0,
    true,
  );
  TestValidator.predicate(
    "access token format is correct",
    () =>
      typeof authorized.token.access === "string" &&
      (authorized.token.access.startsWith("Bearer ") ||
        authorized.token.access.length > 10), // JWT tokens are typically long strings
  );

  // Verify tokens have expiration dates in the future
  await TestValidator.predicate(
    "access token has valid future expiration",
    async () => {
      const date = new Date(authorized.token.expired_at);
      return !isNaN(date.getTime()) && date > new Date();
    },
  );

  await TestValidator.predicate(
    "refresh token has valid future expiration",
    async () => {
      const date = new Date(authorized.token.refreshable_until);
      return !isNaN(date.getTime()) && date > new Date();
    },
  );

  // Verify deleted_at is null for active account
  TestValidator.equals(
    "deleted_at is null for active account",
    authorized.user.deleted_at,
    null,
  );

  // Verify user is automatically authenticated after registration
  // Check that connection has Authorization header
  TestValidator.predicate("connection has authorization header", () => {
    // Check if headers exist and Authorization is not null or undefined
    if (connection.headers === null || connection.headers === undefined)
      return false;

    const authHeader = connection.headers.Authorization;
    if (authHeader === null || authHeader === undefined) return false;

    // Verify Authorization header exists and is a string that starts with Bearer
    return typeof authHeader === "string" && authHeader.startsWith("Bearer ");
  });
}
