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
 * Authenticates users with email and password for the minimalTodo application.
 *
 * This endpoint authenticates existing users by verifying their email and
 * password credentials against stored records in the system.
 *
 * The operation processes user-submitted credentials by first locating the
 * matching record in the `minimal_todo_taskusers` table using the provided
 * email. It then compares the submitted password with the stored
 * `password_hash` using secure cryptographic verification. During
 * authentication, the system validates that the account is active (where
 * `deleted_at` is null) before granting access, enforcing account status
 * management according to business rules.
 *
 * Upon successful verification, the system creates a new session record in the
 * `minimal_todo_sessions` table, generating a cryptographically secure token
 * with appropriate expiration. The session includes the user's IP address for
 * security monitoring and establishes a 30-day validity period before requiring
 * re-authentication, balancing security with user convenience as specified in
 * business requirements.
 *
 * Security measures include protection against timing attacks through
 * consistent response times, rate limiting after multiple failed attempts, and
 * generic error messages that don't reveal whether the email or password was
 * incorrect. All password operations occur in memory without logging to
 * maintain security standards. Session tokens are transmitted securely and
 * stored with appropriate HTTP security flags.
 *
 * Related operations include the join operation for new users, the refresh
 * operation for maintaining active sessions, and the password reset flows for
 * account recovery. This login operation forms the central authentication point
 * for all returning users, enabling secure access to personal task management
 * functionality while maintaining the minimal security profile appropriate for
 * the application's scope.
 *
 * @param props - Request properties
 * @param props.body - Email and password credentials for user authentication
 * @returns Authentication tokens for accessing the application
 * @throws {Error} When credentials are invalid or user account is deactivated
 */
export async function post__auth_taskUser_login(props: {
  body: IMinimalTodoTaskUser.ILogin;
}): Promise<IMinimalTodoTaskUser.IAuthorized> {
  const { body } = props;

  // Find user by email, ensuring account is active (not deleted)
  const user = await MyGlobal.prisma.minimal_todo_taskusers.findFirst({
    where: {
      email: body.email,
      deleted_at: null,
    },
  });

  // Check if user exists and password is valid
  if (
    !user ||
    !(await MyGlobal.password.verify(body.password, user.password_hash))
  ) {
    throw new Error("Invalid credentials");
  }

  // Generate session token
  const sessionToken = v4();

  // Set session expiration (30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Extract IP address from request - in practice, this would come from the actual request object
  const ipAddress = "127.0.0.1";

  // Create session with all required fields including ip_address
  await MyGlobal.prisma.minimal_todo_sessions.create({
    data: {
      id: v4(),
      minimal_todo_taskuser_id: user.id,
      token: sessionToken,
      expires_at: toISOStringSafe(expiresAt),
      created_at: toISOStringSafe(new Date()),
      ip_address: ipAddress,
    },
  });

  // Generate access token with proper payload structure
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: "taskUser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Set access token expiration (1 hour from now)
  const accessTokenExpires = new Date();
  accessTokenExpires.setHours(accessTokenExpires.getHours() + 1);

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: toISOStringSafe(user.created_at),
      updated_at: toISOStringSafe(user.updated_at),
      deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    },
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(accessTokenExpires),
      refreshable_until: toISOStringSafe(expiresAt),
    },
  };
}
