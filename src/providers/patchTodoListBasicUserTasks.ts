import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ITodoListTasks } from "@ORGANIZATION/PROJECT-api/lib/structures/ITodoListTasks";
import { IPageITodoListTasks } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageITodoListTasks";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { BasicuserPayload } from "../decorators/payload/BasicuserPayload";

export async function patchTodoListBasicUserTasks(props: {
  basicUser: BasicuserPayload;
  taskId: string & tags.Format<"uuid">;
  body: ITodoListTasks.IRequest;
}): Promise<IPageITodoListTasks> {
  const { basicUser, body } = props;

  // Use inline object construction with conditional spread for proper type inference
  const where = {
    todo_list_basicuser_id: basicUser.id,
    ...(body.completed !== undefined && { completed: body.completed }),
    ...(body.createdAt && {
      created_at: {
        ...(body.createdAt.from && { gte: body.createdAt.from }),
        ...(body.createdAt.to && { lte: body.createdAt.to }),
      },
    }),
    ...(body.completedAt && {
      completed_at: {
        ...(body.completedAt.from && { gte: body.completedAt.from }),
        ...(body.completedAt.to && { lte: body.completedAt.to }),
      },
    }),
    ...(body.search && {
      description: { contains: body.search },
    }),
  };

  // Set up pagination
  const page = body.page || 1;
  const limit = body.limit || 20;
  const skip = (page - 1) * limit;

  // Set up sorting
  const order = body.order || "desc";
  const orderBy =
    body.sortBy === "description"
      ? { description: order }
      : { created_at: order };

  // Execute both queries concurrently
  const [tasks, total] = await Promise.all([
    MyGlobal.prisma.todo_list_tasks.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    MyGlobal.prisma.todo_list_tasks.count({ where }),
  ]);

  // Transform Prisma results to DTO format
  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: tasks.map((task) => ({
      id: task.id,
      description: task.description,
      completed: task.completed,
      completedAt: task.completed_at
        ? toISOStringSafe(task.completed_at)
        : null,
      createdAt: toISOStringSafe(task.created_at),
      updatedAt: toISOStringSafe(task.updated_at),
      userId: task.todo_list_basicuser_id,
    })),
  };
}
