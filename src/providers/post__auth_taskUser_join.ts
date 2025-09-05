import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTaskUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTaskUser";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

export async function post__auth_taskUser_join(props: {
  body: {
    email: string & tags.Format<"email">;
    password: string;
  };
}): Promise<{
  user: {
    id: string & tags.Format<"uuid">;
    email: string & tags.Format<"email">;
    created_at: string & tags.Format<"date-time">;
    updated_at: string & tags.Format<"date-time">;
    deleted_at?: (string & tags.Format<"date-time">) | null;
  };
  token: {
    access: string;
    refresh: string;
    expired_at: string & tags.Format<"date-time">;
    refreshable_until: string & tags.Format<"date-time">;
  };
}> {
  const { email, password } = props.body;

  // Validate password complexity: minimum 8 characters with letters and numbers
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  if (password.length < 8 || !hasLetters || !hasNumbers) {
    throw new Error(
      "Password must be at least 8 characters long and contain both letters and numbers",
    );
  }

  // Check if user with this email already exists
  const existingUser = await MyGlobal.prisma.minimal_todo_taskusers.findFirst({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  // Generate ID and hash password
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const hashedPassword = await MyGlobal.password.hash(password);

  // Create the user
  const user = await MyGlobal.prisma.minimal_todo_taskusers.create({
    data: {
      id,
      email,
      password_hash: hashedPassword,
      created_at: now,
      updated_at: now,
    },
  });

  // Calculate token expiration times
  const accessExpiresInMs = 60 * 60 * 1000; // 1 hour
  const refreshExpiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 days

  const accessExpiredAt = toISOStringSafe(
    new Date(Date.now() + accessExpiresInMs),
  );
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + refreshExpiresInMs),
  );

  // Generate tokens
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

  // Return the authorized response
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
      expired_at: accessExpiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
