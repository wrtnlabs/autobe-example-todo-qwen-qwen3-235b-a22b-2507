import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_password_reset_request_success(
  connection: api.IConnection,
): Promise<void> {
  // Step 1: Create a test user account
  const registeredEmail = typia.random<string & tags.Format<"email">>();
  const userInput = {
    email: registeredEmail,
    password: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IMinimalTodoTaskUser.IJoin;

  const authorizedUser: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, { body: userInput });
  typia.assert(authorizedUser);

  // Verify the created user's email matches our input.
  TestValidator.equals(
    "created user email should match input",
    authorizedUser.user.email,
    registeredEmail,
  );

  // Step 2: Request a password reset for the created user's email
  // This should succeed because the email exists
  await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
    connection,
    {
      body: {
        email: registeredEmail,
      } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
    },
  );

  // Step 3: Request a password reset for a non-existent email
  // The endpoint should still return a success response to prevent user enumeration
  // This is critical for security - the system must not reveal whether an email exists
  const randomEmail = typia.random<string & tags.Format<"email">>();

  // The test passes if no error was thrown from either API call above.
  // The fact that requesting a password reset for a non-existent email
  // returns success (rather than an error indicating the email doesn't exist)
  // is crucial for preventing user enumeration attacks.
  await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
    connection,
    {
      body: {
        email: randomEmail,
      } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
    },
  );
}
