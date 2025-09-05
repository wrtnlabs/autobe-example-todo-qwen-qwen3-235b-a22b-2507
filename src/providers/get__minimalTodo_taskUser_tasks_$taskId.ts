import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

/**
 * Retrieve detailed information about a specific task.
 *
 * Retrieve a single task by its unique identifier with all detailed information
 * including title, status, creation timestamp, and completion timestamp if
 * applicable. This operation provides specific access to individual tasks when
 * users need detailed information beyond what's available in list views.
 *
 * The operation integrates with the minimal_todo_tasks table as defined in the
 * Prisma schema, ensuring consistent access to the complete task data. Security
 * considerations include user data isolation to ensure users can only access
 * their own tasks, with authorization checks performed before returning any
 * task details.
 *
 * Performance considerations ensure rapid retrieval of single tasks, with
 * response times optimized for immediate feedback. The operation supports
 * common user scenarios such as viewing task details before completion or
 * reviewing completed tasks in full detail.
 *
 * @param props - Request properties
 * @param props.taskUser - The authenticated task user making the request
 * @param props.taskId - Unique identifier of the task to retrieve
 * @returns Detailed information about the requested task
 * @throws {Error} When the task does not exist
 * @throws {Error} When attempting to access a task that belongs to another user
 */
export async function get__minimalTodo_taskUser_tasks_$taskId(props: {
  taskUser: TaskuserPayload;
  taskId: string & tags.Format<"uuid">;
}): Promise<IMinimalTodoTask> {
  const { taskUser, taskId } = props;

  // Find the task with its user relation to verify ownership
  const task = await MyGlobal.prisma.minimal_todo_tasks.findUniqueOrThrow({
    where: { id: taskId },
    include: { taskUser: true },
  });

  // Verify the requesting user owns this task
  if (task.taskuser_id !== taskUser.id) {
    throw new Error("Unauthorized: You can only access your own tasks");
  }

  // Convert all DateTime fields to ISO string format
  // Handle completed_at being nullable
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    created_at: toISOStringSafe(task.created_at),
    completed_at: task.completed_at ? toISOStringSafe(task.completed_at) : null,
  };
}
