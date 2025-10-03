import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListTasks } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTasks";
import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

export async function postTodoListBasicUserTasks(props: {
  basicUser: BasicuserPayload;
  todoListTaskId: string &
    tags.Format<"uuid"> &
    tags.ContentMediaType<"text/plain"> &
    tags.Pattern<"^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$"> &
    tags.MinLength<36> &
    tags.MaxLength<36>;
  body: ITodoListTasks.ICreate;
}): Promise<ITodoListTasks> {
  const { basicUser, todoListTaskId, body } = props;

  // Create the new task - trust that schema validation has already ensured
  // description meets MinLength<1> and MaxLength<500> constraints
  const created = await MyGlobal.prisma.todo_list_tasks.create({
    data: {
      id: todoListTaskId,
      todo_list_basicuser_id: basicUser.id,
      description: body.description,
      completed: body.completed ?? false,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return the response in the expected format
  // The completedAt field in DTO allows null | undefined, so we preserve the null value
  // if the database returns null, otherwise convert to ISO string
  return {
    id: created.id,
    description: created.description,
    completed: created.completed,
    completedAt: created.completed_at
      ? toISOStringSafe(created.completed_at)
      : null,
    createdAt: toISOStringSafe(created.created_at),
    updatedAt: toISOStringSafe(created.updated_at),
    userId: created.todo_list_basicuser_id,
  };
}
