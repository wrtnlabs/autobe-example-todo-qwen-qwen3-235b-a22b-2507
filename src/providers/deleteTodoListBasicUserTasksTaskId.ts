import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

export async function deleteTodoListBasicUserTasksTaskId(props: {
  basicUser: BasicuserPayload;
  taskId: string &
    tags.Format<"uuid"> &
    tags.ContentMediaType<"text/plain"> &
    tags.Pattern<"^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"> &
    tags.MinLength<36> &
    tags.MaxLength<36>;
}): Promise<void> {
  // Verify the task exists and belongs to the authenticated user
  const task = await MyGlobal.prisma.todo_list_tasks.findUniqueOrThrow({
    where: {
      id: props.taskId,
      todo_list_basicuser_id: props.basicUser.id,
    },
  });

  // Perform hard delete since there's no deleted_at field in the schema
  await MyGlobal.prisma.todo_list_tasks.delete({
    where: {
      id: task.id,
    },
  });
}
