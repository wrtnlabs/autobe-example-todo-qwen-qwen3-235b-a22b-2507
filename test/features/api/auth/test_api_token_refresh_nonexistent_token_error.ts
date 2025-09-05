import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";

export async function test_api_token_refresh_nonexistent_token_error(
  connection: api.IConnection,
): Promise<void> {
  // Create and authenticate a taskUser account as prerequisite
  const email = typia.random<string & tags.Format<"email">>();
  const password = "password123";

  // Join to establish taskUser authentication context
  const authorized = await api.functional.auth.taskUser.join(connection, {
    body: {
      email,
      password,
    } satisfies IMinimalTodoTaskUser.IJoin,
  });
  typia.assert(authorized);

  // Generate a non-existent refresh token that resembles a real token format
  const fakeToken = typia.random<string & tags.MaxLength<255>>();

  // Attempt to refresh with non-existent token
  // This should fail as the token doesn't exist in minimal_todo_sessions table
  await TestValidator.error(
    "should fail to refresh with non-existent token",
    async () => {
      await api.functional.auth.taskUser.refresh(connection, {
        body: {
          refreshToken: fakeToken,
        } satisfies IMinimalTodoTaskUser.IRefresh,
      });
    },
  );
}
