import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_task_user_registration_invalid_email_format_error(
  connection: api.IConnection,
): Promise<void> {
  // Test email without @ symbol
  await TestValidator.error(
    "API should reject email without @ symbol",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email: (RandomGenerator.alphabets(8) +
            "example.com") satisfies string & tags.Format<"email">,
          password: "validPassword123",
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );

  // Test email with invalid domain (no period in domain)
  await TestValidator.error(
    "API should reject email with invalid domain format",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email: (RandomGenerator.alphabets(5) +
            "@" +
            RandomGenerator.alphabets(10)) satisfies string &
            tags.Format<"email">,
          password: "validPassword123",
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );

  // Test email without domain extension
  await TestValidator.error(
    "API should reject email without domain extension",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email: (RandomGenerator.alphabets(5) + "@example") satisfies string &
            tags.Format<"email">,
          password: "validPassword123",
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );

  // Test email with special characters in local part
  await TestValidator.error(
    "API should reject email with invalid special characters",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email: "test#!@example.com" satisfies string & tags.Format<"email">,
          password: "validPassword123",
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );

  // Test empty email
  await TestValidator.error("API should reject empty email", async () => {
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email: "" satisfies string & tags.Format<"email">,
        password: "validPassword123",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  });
}
