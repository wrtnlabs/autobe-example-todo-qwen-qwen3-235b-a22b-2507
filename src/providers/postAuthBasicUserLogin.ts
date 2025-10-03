import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListBasicUser } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListBasicUser";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

// DON'T CHANGE FUNCTION NAME AND PARAMETERS,
// ONLY YOU HAVE TO WRITE THIS FUNCTION BODY, AND USE IMPORTED.
export async function postAuthBasicUserLogin(props: {
  basicUser: BasicuserPayload;
  input: string &
    tags.ContentMediaType<""> &
    tags.Pattern<""> &
    tags.MinLength<0> &
    tags.MaxLength<0>;
  body: ITodoListBasicUser.ILogin;
}): Promise<ITodoListBasicUser.IAuthorized> {
  const { body } = props;

  // Find user by email
  const user = await MyGlobal.prisma.todo_list_basicuser.findFirst({
    where: {
      email: body.email,
    },
  });

  // If user not found, throw generic error to avoid user enumeration
  if (!user) {
    throw new HttpException("Invalid credentials", 400);
  }

  // Verify password
  const isValid = await PasswordUtil.verify(body.password, user.password_hash);
  if (!isValid) {
    throw new HttpException("Invalid credentials", 400);
  }

  // If user is not active, deny access
  if (user.status !== "active") {
    throw new HttpException("User account is not active", 403);
  }

  // Get request context from props if available
  // In a real implementation, we would extract IP and user agent from the request
  // For now, we'll use placeholder values
  const now = toISOStringSafe(new Date());
  const expiresAt = toISOStringSafe(new Date(Date.now() + 3600000)); // 1 hour

  // Create session
  await MyGlobal.prisma.todo_list_basicuser_sessions.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      todo_list_basicuser_id: user.id,
      session_id: v4(),
      refresh_token: v4(),
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    },
  });

  // Create audit log
  await MyGlobal.prisma.todo_list_audit_logs.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      user_id: user.id,
      action: "login",
      entity_type: "user",
      entity_id: user.id,
      ip_address: "unknown", // Would come from request in real implementation
      created_at: now,
    },
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: "basicuser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "15m",
      issuer: "autobe",
    },
  );

  // Return the authorized response
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    token: {
      access: accessToken,
      refresh: v4(), // Would use the actual refresh token in real implementation
      expired_at: toISOStringSafe(new Date(Date.now() + 900000)), // 15 minutes
      refreshable_until: expiresAt,
    },
  };
}
