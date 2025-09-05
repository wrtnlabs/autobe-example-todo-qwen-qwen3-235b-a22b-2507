import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";

/// Complete's a user's password reset request by validating the provided token and updating their password.
///
/// This function processes the password reset completion request by first validating the
/// reset token against the database. It ensures the token exists, has not expired, and is
/// associated with a valid user account. Once validated, it securely hashes the new
/// password and updates the user's credentials. The function also invalidates all
/// existing sessions for security purposes and cleans up the used reset token.
///
/// The operation follows a strict security protocol:
/// 1. Token validation with expiration check
/// 2. User account verification
/// 3. Secure password hashing
/// 4. Password update in user record
/// 5. Session cleanup for security
/// 6. Reset token record cleanup
///
/// @param props - Request properties
/// @param props.token - Validation token for password reset confirmation
/// @param props.body - New password credentials for account recovery
/// @returns void
/// @throws {Error} when token is invalid, expired, or associated user doesn't exist
/// @throws {Error} when new password validation fails
/// @throws {Error} when database operations fail
export async function resetPasswordComplete(props: {
  /** Validation token for password reset confirmation */
  token: string;
  /** New password credentials for account recovery */
  body: IMinimalTodoTaskUser.IPasswordResetComplete;
}): Promise<void> {
  const { token, body } = props;

  // Step 1: Validate the reset token exists and is not expired
  const resetRecord =
    await MyGlobal.prisma.minimal_todo_password_resets.findUniqueOrThrow({
      where: {
        token,
        expires_at: { gte: new Date() }, // Ensure token hasn't expired
      },
      include: { user: true }, // Include the associated user
    });

  // Step 2: Validate the user account exists and is not deleted
  if (!resetRecord.user || resetRecord.user.deleted_at !== null) {
    throw new Error("User account not found or deactivated");
  }

  // Step 3: Validate the new password meets requirements
  // TODO: Implement actual password validation based on system requirements
  if (!body.password || body.password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Step 4: Hash the new password
  const hashedPassword = await MyGlobal.password.hash(body.password);

  // Step 5: Update the user's password
  await MyGlobal.prisma.minimal_todo_taskusers.update({
    where: { id: resetRecord.minimal_todo_taskuser_id },
    data: { password_hash: hashedPassword },
  });

  // Step 6: Invalidate all active sessions for this user
  await MyGlobal.prisma.minimal_todo_sessions.deleteMany({
    where: { minimal_todo_taskuser_id: resetRecord.minimal_todo_taskuser_id },
  });

  // Step 7: Delete the used reset token to prevent reuse
  await MyGlobal.prisma.minimal_todo_password_resets.delete({
    where: { id: resetRecord.id },
  });

  // Operation complete - no return value needed
  return;
}
