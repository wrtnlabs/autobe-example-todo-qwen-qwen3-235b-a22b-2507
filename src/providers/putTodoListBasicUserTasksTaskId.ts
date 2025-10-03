import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListTask } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTask";
import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

export async function putTodoListBasicUserTasksTaskId(props: {
  basicUser: BasicuserPayload;
  taskId: string &
    tags.Format<"uuid"> &
    tags.ContentMediaType<"text/plain"> &
    tags.Pattern<"^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"> &
    tags.MinLength<36> &
    tags.MaxLength<36>;
  body: ITodoListTask.IUpdate;
}): Promise<ITodoListTask> {
  const { basicUser, taskId, body } = props;

  // Get current timestamp as ISO string
  const now = toISOStringSafe(new Date());

  // Find the task and verify ownership
  const task = await MyGlobal.prisma.todo_list_tasks.findUniqueOrThrow({
    where: {
      id: taskId,
      todo_list_basicuser_id: basicUser.id,
    },
  });

  // Prepare update data
  const updateData = {
    description: body.description ?? undefined,
    completed: body.completed ?? undefined,
    // Handle completed_at timestamp based on completion status changes
    completed_at:
      body.completed === true && !task.completed_at
        ? now
        : body.completed === false && task.completed_at
          ? null
          : task.completed_at,
    // Update updated_at timestamp
    updated_at: now,
  };

  // Perform the update
  const updated = await MyGlobal.prisma.todo_list_tasks.update({
    where: { id: taskId },
    data: updateData,
  });

  // Convert Date objects to ISO strings in the response
  return {
    id: updated.id as string & tags.Format<"uuid">,
    description: updated.description,
    completed: updated.completed,
    completedAt: updated.completed_at
      ? toISOStringSafe(updated.completed_at)
      : null,
    createdAt: toISOStringSafe(updated.created_at),
    updatedAt: toISOStringSafe(updated.updated_at),
  };
}
