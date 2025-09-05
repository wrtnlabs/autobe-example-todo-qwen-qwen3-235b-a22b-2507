import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import { IPageIMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIMinimalTodoTask";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

/**
 * Search and retrieve a filtered, paginated list of tasks for the authenticated
 * user
 *
 * This operation retrieves a paginated list of tasks from the minimalTodo
 * application's database, allowing users to search, filter, and sort their
 * tasks. It operates on the minimal_todo_tasks table and supports complex
 * queries to find tasks based on various criteria including title, status,
 * creation date, and completion status.
 *
 * @param props - Request properties
 * @param props.taskUser - The authenticated task user making the request
 * @param props.body - The search criteria and pagination parameters for
 *   retrieving tasks
 * @returns Paginated list of task summary information matching search criteria
 * @throws {Error} When the user is not found or inactive
 */
export async function patch__minimalTodo_taskUser_tasks(props: {
  taskUser: TaskuserPayload;
  body: IMinimalTodoTask.IRequest;
}): Promise<IPageIMinimalTodoTask.ISummary> {
  const { taskUser, body } = props;

  // Validate user exists and is active
  const user = await MyGlobal.prisma.minimal_todo_taskusers.findFirst({
    where: {
      id: taskUser.id,
      deleted_at: null,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Extract filter parameters from body
  const {
    title,
    status,
    created_at_from: createdAtFrom,
    created_at_to: createdAtTo,
    completed_at_from: completedAtFrom,
    completed_at_to: completedAtTo,
    page = 1,
    limit = 20,
  } = body;

  // Calculate pagination values
  const pageNumber = page > 0 ? page : 1;
  const limitNumber = Math.max(1, Math.min(limit, 100));
  const skip = (pageNumber - 1) * limitNumber;

  // Build where condition for task filtering
  const whereCondition = {
    taskuser_id: user.id,
    deleted_at: null,
    ...(title && {
      title: {
        contains: title,
        mode: "insensitive" as const,
      },
    }),
    ...(status && {
      status: status,
    }),
    ...((createdAtFrom || createdAtTo) && {
      created_at: {
        ...(createdAtFrom && { gte: createdAtFrom }),
        ...(createdAtTo && { lte: createdAtTo }),
      },
    }),
    ...((completedAtFrom || completedAtTo) && {
      completed_at: {
        ...(completedAtFrom && { gte: completedAtFrom }),
        ...(completedAtTo && { lte: completedAtTo }),
      },
    }),
  };

  // Execute search with pagination
  const [tasks, total] = await Promise.all([
    MyGlobal.prisma.minimal_todo_tasks.findMany({
      where: whereCondition,
      orderBy: {
        created_at: "desc",
      },
      skip: skip,
      take: limitNumber,
    }),
    MyGlobal.prisma.minimal_todo_tasks.count({
      where: whereCondition,
    }),
  ]);

  // Transform tasks to response format with ISO datetime strings
  const data = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    created_at: toISOStringSafe(task.created_at),
    completed_at: task.completed_at ? toISOStringSafe(task.completed_at) : null,
  }));

  // Return paginated response
  return {
    pagination: {
      current: Number(pageNumber),
      limit: Number(limitNumber),
      records: total,
      pages: Math.ceil(total / limitNumber),
    },
    data: data,
  };
}
