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

export async function postAuthBasicUserRefresh(props: {
  basicUser: BasicuserPayload;
  input: string;
  body: ITodoListBasicUser.IRefresh;
}): Promise<ITodoListBasicUser.IAuthorized> {
  const now = toISOStringSafe(new Date());

  // Find session by refresh token
  const session = await MyGlobal.prisma.todo_list_basicuser_sessions.findFirst({
    where: {
      refresh_token: props.body.refreshToken,
    },
  });

  if (!session) {
    throw new HttpException("Invalid or expired refresh token", 401);
  }

  // Verify user exists and is active
  const user = await MyGlobal.prisma.todo_list_basicuser.findFirst({
    where: {
      id: session.todo_list_basicuser_id,
      status: "active",
    },
  });

  if (!user) {
    throw new HttpException("User not found or inactive", 401);
  }

  // Verify authorization: the authenticated user must match the session user
  if (user.id !== props.basicUser.id) {
    throw new HttpException("Unauthorized: User mismatch", 401);
  }

  // Generate new access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      type: "basicuser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "15m",
      issuer: "autobe",
    },
  );

  // Generate new refresh token
  const newRefreshToken = jwt.sign(
    {
      sessionId: session.id,
      userId: user.id,
      type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Update session with new tokens and expiration
  await MyGlobal.prisma.todo_list_basicuser_sessions.update({
    where: { id: session.id },
    data: {
      refresh_token: newRefreshToken,
      session_id: v4() as string & tags.Format<"uuid">,
      expires_at: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
      updated_at: now,
    },
  });

  // Parse input to extract request metadata
  const inputObj = JSON.parse(props.input);
  const ipAddress = inputObj.headers?.["x-forwarded-for"] || "127.0.0.1";
  const userAgent = inputObj.headers?.["user-agent"] || "unknown";

  // Create audit log for refresh action
  await MyGlobal.prisma.todo_list_audit_logs.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      user_id: user.id,
      action: "token_refresh",
      entity_type: "basicuser",
      entity_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: now,
    },
  });

  // Return the authorized response
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    token: {
      access: accessToken,
      refresh: newRefreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 15 * 60 * 1000)),
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
    },
  };
}
