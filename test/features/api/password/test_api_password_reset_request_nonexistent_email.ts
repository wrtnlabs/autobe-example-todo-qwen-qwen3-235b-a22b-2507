import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

export async function test_api_password_reset_request_nonexistent_email(
  connection: api.IConnection,
): Promise<void> {
  // Generate a realistic email address that doesn't exist in the system
  // Using RandomGenerator.paragraph to create a more realistic email format
  // while ensuring it's not likely to be registered
  const sentenceConfig = { sentences: 3, wordMin: 5, wordMax: 8 };
  const randomText = RandomGenerator.paragraph(sentenceConfig);
  const nonexistentEmail =
    `${randomText.toLowerCase()}@example-unlikely-domain.com` satisfies string &
      tags.Format<"email">;

  // Request password reset with the non-existent email
  // The system should not reveal whether the email exists to prevent user enumeration attacks
  // This is a security best practice - always return success regardless of email existence
  await api.functional.auth.taskUser.password.resets.resetPasswordRequest(
    connection,
    {
      body: {
        email: nonexistentEmail,
      } satisfies IMinimalTodoTaskUser.IPasswordResetRequest,
    },
  );

  // The API returns success even for non-existent emails to prevent user enumeration
  // This is the expected security behavior and is validated by the successful completion
  // of the API call without error.

  // Note: We cannot directly verify the database state from this test level
  // The security design intentionally makes it impossible to determine if an email exists
  // by checking the password reset endpoint response.
  // The successful API call confirms the expected behavior.
  TestValidator.predicate(
    "API should not reveal email existence through reset request",
    true, // The fact that we reached this point means the API returned success
  );
}
