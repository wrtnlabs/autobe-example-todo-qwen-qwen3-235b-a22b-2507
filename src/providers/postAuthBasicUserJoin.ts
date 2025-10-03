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
export async function postAuthBasicUserJoin(props: {
  basicUser: BasicuserPayload;
  input: string;
  body: ITodoListBasicUser.ICreate;
}): Promise<ITodoListBasicUser.IAuthorized> {
  const { body } = props;

  // Check if user with this email already exists
  const existingUser = await MyGlobal.prisma.todo_list_basicuser.findUnique({
    where: { email: body.email },
  });

  if (existingUser !== null) {
    throw new HttpException("User with this email already exists", 409);
  }

  // Hash the password before storing
  const hashedPassword = await PasswordUtil.hash(body.password);

  // Create new user with UUID
  const now = toISOStringSafe(new Date());
  const created = await MyGlobal.prisma.todo_list_basicuser.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      email: body.email,
      password_hash: hashedPassword,
      status: "active",
      created_at: now,
      updated_at: now,
    },
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { id: created.id, type: "basicuser" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );
  const refreshToken = jwt.sign(
    { id: created.id, type: "basicuser", tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: created.id,
    email: created.email,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 60 * 60 * 1000)),
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
    },
  };
}
