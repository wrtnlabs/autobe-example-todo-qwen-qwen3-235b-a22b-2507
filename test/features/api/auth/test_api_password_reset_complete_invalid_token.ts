import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

export async function test_api_password_reset_complete_invalid_token(
  connection: api.IConnection,
): Promise<void> {
  const invalidToken: string = "invalid-token";
  const requestBody = {
    password: RandomGenerator.paragraph({ sentences: 10 }),
  } satisfies IMinimalTodoTaskUser.IPasswordResetComplete;

  await TestValidator.httpError(
    "Password reset with invalid token should fail with 400 Bad Request",
    400,
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordComplete(
        connection,
        {
          token: invalidToken,
          body: requestBody,
        },
      );
    },
  );
}
