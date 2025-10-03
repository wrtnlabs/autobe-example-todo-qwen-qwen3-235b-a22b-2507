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

export async function getTodoListBasicUserTasksTaskId(props: {
  basicUser: BasicuserPayload;
  taskId: string & tags.Format<"uuid">;
}): Promise<ITodoListTasks> {
  const { basicUser, taskId } = props;

  // Find the task and verify it belongs to the authenticated user
  const task = await MyGlobal.prisma.todo_list_tasks.findFirst({
    where: {
      id: taskId,
      todo_list_basicuser_id: basicUser.id,
    },
  });

  // If no task found, it either doesn't exist or doesn't belong to the user
  if (!task) {
    throw new HttpException("Task not found or access denied", 403);
  }

  // Transform Prisma result to match ITodoListTasks interface
  return {
    id: task.id,
    description: task.description,
    completed: task.completed,
    completedAt: task.completed_at
      ? toISOStringSafe(task.completed_at)
      : undefined,
    createdAt: toISOStringSafe(task.created_at),
    updatedAt: toISOStringSafe(task.updated_at),
    userId: task.todo_list_basicuser_id,
  };
}
