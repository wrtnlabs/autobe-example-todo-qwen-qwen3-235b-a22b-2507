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

export async function postAuthBasicUserPasswordResetValidate(props: {
  basicUser: BasicuserPayload;
  input: string;
  body: ITodoListBasicUser.IValidatePasswordResetToken;
}): Promise<ITodoListBasicUser.IValidatePasswordResetTokenResponse> {
  const { body } = props;

  // Find the password reset token
  const tokenRecord =
    await MyGlobal.prisma.todo_list_password_reset_tokens.findFirst({
      where: { token: body.token },
    });

  // If no token exists, return invalid
  if (!tokenRecord) {
    return { valid: false };
  }

  // Get current time as ISO string
  const now = toISOStringSafe(new Date());

  // Check if token has expired - convert expires_at to ISO string using toISOStringSafe for comparison
  if (toISOStringSafe(tokenRecord.expires_at) > now) {
    // expires_at is stored as string in ISO format
    return { valid: false };
  }

  // Check if token has been used
  if (tokenRecord.used_at !== null) {
    return { valid: false };
  }

  // Check if token has been revoked (deleted)
  if (tokenRecord.deleted_at !== null) {
    return { valid: false };
  }

  // All checks passed, token is valid
  return { valid: true };
}
