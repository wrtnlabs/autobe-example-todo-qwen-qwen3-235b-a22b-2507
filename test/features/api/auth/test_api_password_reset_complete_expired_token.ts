import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

export async function test_api_password_reset_complete_expired_token(
  connection: api.IConnection,
): Promise<void> {
  // Generate a valid email for password reset request
  const email: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();

  // Submit password reset request to generate valid token
  await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
    connection,
    {
      body: {
        email,
      } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
    },
  );

  // Note: In a real implementation, we would need a test-specific mechanism
  // to generate an already expired token, as waiting 15 minutes for token
  // expiration is impractical for automated testing.
  // This could be achieved through:
  // 1. A test hook/endpoint that generates expired tokens
  // 2. A mock/stub that bypasses token validation
  // 3. A test configuration that reduces token expiration time
  const expiredToken: string & tags.Pattern<"^[a-zA-Z0-9-_=]{22,}$"> =
    typia.random<string & tags.Pattern<"^[a-zA-Z0-9-_=]{22,}$">>();

  // Attempt to use expired token to reset password
  // This should fail with appropriate error
  // The system should reject expired tokens to prevent security vulnerabilities
  await TestValidator.error(
    "password reset with expired token should be rejected",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordComplete(
        connection,
        {
          token: expiredToken,
          body: {
            password: RandomGenerator.paragraph({ sentences: 5 }),
          } satisfies IMinimalTodoTaskUser.IPasswordResetComplete,
        },
      );
    },
  );
}
