import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_login_nonexistent_email_error(
  connection: api.IConnection,
) {
  // 1. Create a valid user account first to ensure authentication system works
  const validEmail = typia.random<string & tags.Format<"email">>();
  const validPassword = "TestPassword123";

  const joinInput = {
    body: {
      email: validEmail,
      password: validPassword,
    } satisfies IMinimalTodoTaskUser.IJoin,
  };

  // This should succeed and return authorized user data
  const joinResponse: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, joinInput);
  typia.assert(joinResponse);

  // 2. Verify the created user can log in with correct credentials
  // This confirms our authentication system is functioning properly
  const loginInputValid = {
    body: {
      email: validEmail,
      password: validPassword,
    } satisfies IMinimalTodoTaskUser.ILogin,
  };

  const loginResponse: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.login(connection, loginInputValid);
  typia.assert(loginResponse);

  // 3. Generate a completely different email address that should not exist in the system
  // This creates a realistic user enumeration attack scenario
  const nonExistentEmail = typia.random<string & tags.Format<"email">>();

  // Ensure the non-existent email is different from the valid one
  TestValidator.predicate(
    "non-existent email should be different from valid email",
    nonExistentEmail !== validEmail,
  );

  const loginInputInvalid = {
    body: {
      email: nonExistentEmail,
      password: "WrongPassword123",
    } satisfies IMinimalTodoTaskUser.ILogin,
  };

  // 4. Attempt to log in with non-existent email
  // The system should return a generic error that does not reveal whether the email exists
  // This prevents user enumeration attacks by not leaking account information
  await TestValidator.error(
    "login should fail with generic error for non-existent email to prevent user enumeration",
    async () => {
      await api.functional.auth.taskUser.login(connection, loginInputInvalid);
    },
  );
}
