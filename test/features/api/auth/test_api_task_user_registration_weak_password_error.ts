import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_registration_weak_password_error(
  connection: api.IConnection,
): Promise<void> {
  // Generate valid email that meets format requirements
  const email: string = typia.random<string & tags.Format<"email">>();

  // Test minimum 8 character requirement
  await TestValidator.error(
    "Password must be at least 8 characters long",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email,
          password: "abc123", // 6 characters - less than minimum
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );

  // Test letter requirement
  await TestValidator.error("Password must contain letters", async () => {
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password: "12345678", // 8 digits only
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  });

  // Test digit requirement
  await TestValidator.error("Password must contain digits", async () => {
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password: "password", // 8 letters only
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  });
}
