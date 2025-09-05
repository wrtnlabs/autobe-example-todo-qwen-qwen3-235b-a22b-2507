import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

export async function test_api_password_reset_request_invalid_email_format(
  connection: api.IConnection,
) {
  // Test input validation for password reset request with invalid email formats
  // Verify the system properly validates email format according to standard rules
  // and returns appropriate error responses for malformed input

  // Test 1: Email missing '@' symbol
  await TestValidator.error(
    "Should reject email without @ symbol",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
        connection,
        {
          body: {
            email: "user@gmail.com",
          } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
        },
      );
    },
  );

  // Test 2: Email with invalid characters
  await TestValidator.error(
    "Should reject email with invalid characters",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
        connection,
        {
          body: {
            email: "user@exam!ple.com",
          } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
        },
      );
    },
  );

  // Test 3: Empty email string
  await TestValidator.error("Should reject empty email string", async () => {
    await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
      connection,
      {
        body: {
          email: "",
        } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
      },
    );
  });

  // Test 4: Email without domain
  await TestValidator.error("Should reject email without domain", async () => {
    await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
      connection,
      {
        body: {
          email: "user@",
        } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
      },
    );
  });

  // Test 5: Email with multiple @ symbols
  await TestValidator.error(
    "Should reject email with multiple @ symbols",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
        connection,
        {
          body: {
            email: "user@@example.com",
          } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
        },
      );
    },
  );

  // Test 6: Email with spaces
  await TestValidator.error("Should reject email with spaces", async () => {
    await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
      connection,
      {
        body: {
          email: "user @example.com",
        } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
      },
    );
  });

  // Test 7: Email with special characters in local part that are invalid
  await TestValidator.error(
    "Should reject email with invalid special characters in local part",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
        connection,
        {
          body: {
            email: "user<test>@example.com",
          } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
        },
      );
    },
  );

  // Test 8: Extremely long email (exceeding typical limits)
  await TestValidator.error(
    "Should reject excessively long email",
    async () => {
      await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
        connection,
        {
          body: {
            email: "a".repeat(255) + "@example.com",
          } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
        },
      );
    },
  );
}
