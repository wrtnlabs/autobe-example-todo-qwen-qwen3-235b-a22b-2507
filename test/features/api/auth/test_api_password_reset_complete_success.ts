import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

/**
 * Tests the successful completion of password reset using a valid token.
 *
 * This test verifies that the password reset completion endpoint
 * successfully processes valid reset tokens with new passwords. The test
 * generates a valid token and valid password data, then calls the
 * resetPasswordComplete endpoint to confirm it accepts the request and
 * returns a successful response.
 *
 * Note: This test cannot verify the actual password change or login
 * functionality since the user management and authentication endpoints are
 * not available in the current API specification.
 */
export async function test_api_password_reset_complete_success(
  connection: api.IConnection,
) {
  // Generate a valid reset token as specified in the API documentation
  // Pattern: ^[a-zA-Z0-9-_=]{22,}$
  const token = typia.random<string & tags.Pattern<"^[a-zA-Z0-9-_=]{22,}$">>();

  // Create valid password reset completion data
  const passwordResetData = {
    password: "new_secure_password123!@#",
  } satisfies IMinimalTodoTaskUser.IPasswordResetComplete;

  // Call the password reset completion endpoint with valid data
  // This should succeed with a 200 OK response
  await api.functional.auth.taskUser.password.resets.resetPasswordComplete(
    connection,
    {
      token,
      body: passwordResetData,
    },
  );

  // Note: We cannot verify the actual password change or test login
  // functionality since those endpoints are not available in the API
}
