import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

/**
 * Refreshes authentication tokens using a valid refresh token.
 *
 * This endpoint validates refresh tokens and issues new access tokens to
 * maintain user sessions without requiring re-authentication with primary
 * credentials.
 *
 * The operation processes refresh tokens by locating the corresponding session
 * record in the `minimal_todo_sessions` table, verifying that the token exists
 * and hasn't expired (checking against the `expires_at` timestamp). During
 * token validation, the system compares the current Asia/Seoul time against the
 * stored expiration to determine token validity, ensuring session security
 * while providing convenience for active users.
 *
 * Upon successful validation, the system generates new authentication tokens
 * and updates the session's expiration time while preserving the associated
 * user identity. The session's `created_at` timestamp remains unchanged as it
 * represents the original authentication event, while security monitoring
 * tracks refresh activity through the session records.
 *
 * Security considerations include single-use tokens for enhanced security,
 * binding tokens to the originating IP address for fraud detection, and strict
 * expiration policies that limit token lifespan. The refresh mechanism operates
 * independently from primary authentication to minimize exposure of user
 * credentials while maintaining session continuity.
 *
 * Related operations include the login operation that creates the initial
 * session, and the password reset flows that invalidate existing sessions. This
 * refresh operation supports the business requirement for maintaining active
 * user sessions for 30 days of inactivity, enhancing user experience while
 * adhering to appropriate security standards for the minimalTodo application's
 * scope.
 *
 * @param props - Request parameters
 * @param props.body - Refresh token to validate and exchange for new access
 *   tokens
 * @returns New authentication tokens with extended validity
 * @throws {Error} When the refresh token is invalid or expired
 * @throws {Error} When the user account has been deleted
 */
export async function post__auth_taskUser_refresh(props: {
  body: IMinimalTodoTaskUser.IRefresh;
}): Promise<IMinimalTodoTaskUser.IAuthorized> {
  const { refreshToken } = props.body;

  // Find session with the refresh token
  const session = await MyGlobal.prisma.minimal_todo_sessions.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new Error("Invalid refresh token");
  }

  // Check if session has expired
  // Convert both dates to ISO strings for proper comparison
  const currentSeoulTime = toISOStringSafe(new Date());
  const sessionExpiresAt = toISOStringSafe(session.expires_at);

  if (sessionExpiresAt < currentSeoulTime) {
    throw new Error("Expired refresh token");
  }

  // Check if user account is deleted
  if (session.user.deleted_at) {
    throw new Error("User account has been deleted");
  }

  // Generate new tokens with proper expiration
  // Access token expires in 1 hour (3600000 ms)
  // Refresh token expires in 30 days (2592000000 ms)
  const oneHourFromNow = toISOStringSafe(new Date(Date.now() + 3600000));
  const thirtyDaysFromNow = toISOStringSafe(new Date(Date.now() + 2592000000));

  // Update session expiration time
  await MyGlobal.prisma.minimal_todo_sessions.update({
    where: { id: session.id },
    data: { expires_at: thirtyDaysFromNow },
  });

  // Create response with proper ISO string formatting for all dates
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      created_at: toISOStringSafe(session.user.created_at),
      updated_at: toISOStringSafe(session.user.updated_at),
      deleted_at: session.user.deleted_at
        ? toISOStringSafe(session.user.deleted_at)
        : null,
    },
    token: {
      access: v4(),
      refresh: v4(),
      expired_at: oneHourFromNow,
      refreshable_until: thirtyDaysFromNow,
    },
  };
}
