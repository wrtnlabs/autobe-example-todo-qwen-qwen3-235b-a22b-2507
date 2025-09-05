import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

/**
 * Test that user registration fails when attempting to use an already
 * registered email address.
 *
 * This test validates the critical business rule that email addresses must
 * be unique across all user accounts in the system. It ensures data
 * integrity by preventing duplicate accounts and potential security issues
 * that could arise from multiple accounts sharing the same email.
 *
 * The test follows a complete workflow:
 *
 * 1. Creates a user account with a randomly generated email address
 * 2. Attempts to create a second account with the same email address
 * 3. Verifies that the system properly rejects the duplicate registration
 *
 * This prevents scenarios where users could circumvent account limits or
 * where customer support might accidentally create duplicate accounts. The
 * unique email constraint is enforced at the database level in the
 * minimal_todo_taskusers table, and this test ensures that constraint is
 * properly exposed through the API with appropriate error responses.
 */
export async function test_api_task_user_registration_duplicate_email_error(
  connection: api.IConnection,
) {
  // Generate a random email address to use for testing
  const email: string = typia.random<string & tags.Format<"email">>();

  // First, create a user with the generated email address
  // This establishes the email in the system to test the duplicate scenario
  const firstUser: IMinimalTodoTaskUser.IAuthorized =
    await api.functional.auth.taskUser.join(connection, {
      body: {
        email,
        password: "test1234",
      } satisfies IMinimalTodoTaskUser.IJoin,
    });
  typia.assert(firstUser);

  // Then, attempt to create a second user with the same email address
  // This should fail with an appropriate error since email addresses must be unique
  await TestValidator.error(
    "User registration should fail when attempting to use an already registered email address",
    async () => {
      await api.functional.auth.taskUser.join(connection, {
        body: {
          email,
          password: "test5678",
        } satisfies IMinimalTodoTaskUser.IJoin,
      });
    },
  );
}
