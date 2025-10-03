import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListBasicUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListBasicUser";
import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

export async function postAuthBasicUserPasswordResetComplete(props: {
  basicUser: BasicuserPayload;
  input: string &
    tags.ContentMediaType<""> &
    tags.Pattern<""> &
    tags.MinLength<0> &
    tags.MaxLength<0>;
  body: ITodoListBasicUser.ICompletePasswordReset;
}): Promise<ITodoListBasicUser.ICompletePasswordResetResponse> {
  const { basicUser, body } = props;

  // Get current time as ISO string
  const now = toISOStringSafe(new Date());

  // Find the reset token - will throw 404 if not found
  const resetToken =
    await MyGlobal.prisma.todo_list_password_reset_tokens.findUniqueOrThrow({
      where: {
        token: body.token,
      },
    });

  // Check if token is expired or already used
  // Convert resetToken.expires_at to ISO string for comparison with now
  if (
    toISOStringSafe(resetToken.expires_at) <= now ||
    resetToken.used_at !== null
  ) {
    throw new HttpException("Invalid or expired reset token", 400);
  }

  // Hash the new password
  const password_hash = await PasswordUtil.hash(body.password);

  // Update user's password
  await MyGlobal.prisma.todo_list_basicuser.update({
    where: {
      id: resetToken.todo_list_basicuser_id,
    },
    data: {
      password_hash: password_hash,
      updated_at: now,
    },
  });

  // Mark token as used
  await MyGlobal.prisma.todo_list_password_reset_tokens.update({
    where: {
      id: resetToken.id,
    },
    data: {
      used_at: now,
      updated_at: now,
    },
  });

  // Create audit log - using available info from resetToken
  await MyGlobal.prisma.todo_list_audit_logs.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      user_id: resetToken.todo_list_basicuser_id,
      action: "password_reset",
      entity_type: "user",
      entity_id: resetToken.todo_list_basicuser_id,
      ip_address: "127.0.0.1", // Using placeholder - should come from request
      user_agent: "", // Using placeholder - should come from request
      created_at: now,
    },
  });

  // Invalidate all existing sessions for this user
  await MyGlobal.prisma.todo_list_basicuser_sessions.deleteMany({
    where: {
      todo_list_basicuser_id: resetToken.todo_list_basicuser_id,
    },
  });

  return {
    success: true,
  };
}
