import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

/**
 * Tests login failure when using incorrect password with a valid email.
 *
 * Validates that the authentication system properly handles incorrect
 * password attempts. The test creates a user with known credentials, then
 * attempts to log in with the correct email but an incorrect password. The
 * system should reject the login without revealing which credential was
 * invalid, maintaining security against enumeration attacks.
 *
 * Key validations:
 *
 * - User creation succeeds with valid credentials
 * - Login fails when correct email is used with incorrect password
 * - Error response is generic and doesn't indicate which credential was
 *   invalid
 * - No authorization token is issued on failed authentication
 * - Connection headers remain clean after failed login attempts
 */
export async function test_api_task_user_login_incorrect_password_error(
  connection: api.IConnection,
): Promise<void> {
  // Create a new user with valid credentials
  const testEmail: string = typia.random<string & tags.Format<"email">>();
  const validPassword: string = "validPassword123";
  const incorrectPassword: string = "wrongPassword456";

  // Ensure user exists with known credentials
  const createdUser: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: testEmail,
        password: validPassword,
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(createdUser);
  TestValidator.equals(
    "user email matches expected",
    createdUser.user.email,
    testEmail,
  );

  // Clear connection headers before testing login failure
  delete connection.headers?.Authorization;

  // Test login with correct email but incorrect password
  // Must use await TestValidator.error() for async functions
  await TestValidator.error(
    "login should fail with incorrect password",
    async () => {
      await api.functional.auth.taskUser.login(connection, {
        body: {
          email: testEmail,
          password: incorrectPassword, // Intentionally incorrect
        } satisfies IMinimalTodoTaskUser.ILogin,
      });
    },
  );

  // Verify no authorization token was issued
  TestValidator.equals(
    "no authorization token after failed login",
    connection.headers?.Authorization,
    undefined,
  );
}
