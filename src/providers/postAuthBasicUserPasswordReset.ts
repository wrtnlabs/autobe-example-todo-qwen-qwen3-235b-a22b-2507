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

export async function postAuthBasicUserPasswordReset(props: {
  basicUser: BasicuserPayload;
  input: string;
  body: ITodoListBasicUser.IRequestPasswordReset;
}): Promise<ITodoListBasicUser.IRequestPasswordResetResponse> {
  const { body } = props;

  // Get current time as ISO string
  const now = toISOStringSafe(new Date());

  // Calculate expiration time (24 hours from now)
  const expirationMs = new Date().getTime() + 24 * 60 * 60 * 1000;
  const expiresAt = toISOStringSafe(new Date(expirationMs));

  // Check if user exists by email
  const user = await MyGlobal.prisma.todo_list_basicuser.findFirst({
    where: { email: body.email },
  });

  // Generate reset token
  const token = v4();

  // If user exists, create or update password reset token
  if (user) {
    // Check if there's an existing token for this user
    let resetToken =
      await MyGlobal.prisma.todo_list_password_reset_tokens.findFirst({
        where: { todo_list_basicuser_id: user.id },
      });

    if (resetToken) {
      // Update existing token
      resetToken = await MyGlobal.prisma.todo_list_password_reset_tokens.update(
        {
          where: { id: resetToken.id },
          data: {
            token,
            expires_at: expiresAt,
            used_at: null,
            updated_at: now,
          },
        },
      );
    } else {
      // Create new token
      resetToken = await MyGlobal.prisma.todo_list_password_reset_tokens.create(
        {
          data: {
            id: v4(),
            todo_list_basicuser_id: user.id,
            token,
            expires_at: expiresAt,
            created_at: now,
            updated_at: now,
          },
        },
      );
    }

    // Create audit log
    await MyGlobal.prisma.todo_list_audit_logs.create({
      data: {
        id: v4(),
        user_id: user.id,
        action: "password_reset_requested",
        entity_type: "todo_list_password_reset_tokens",
        entity_id: resetToken.id,
        ip_address: "127.0.0.1", // This should come from request
        user_agent: "unknown", // This should come from request
        created_at: now,
      },
    });
  }

  // Always return success response regardless of whether user exists
  // This prevents user enumeration attacks
  return {
    success: true,
  };
}
