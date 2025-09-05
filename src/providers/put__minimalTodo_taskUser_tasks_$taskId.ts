import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

/**
 * Update an existing task's details including its title and status.
 *
 * This operation updates an existing task's details including its title and
 * status. Implements the core task management lifecycle, allowing users to
 * modify task information as their work progresses. When updating a task to
 * complete status, the system records the completion timestamp; when updating
 * from complete to incomplete, the system removes the completion timestamp
 * while preserving the creation timestamp.
 *
 * The operation includes validation against business rules, ensuring titles do
 * not exceed 100 characters and required fields are properly provided. Security
 * considerations include user data isolation to ensure users can only modify
 * their own tasks, with proper authorization checks performed before any
 * updates.
 *
 * @param props - Request properties
 * @param props.taskUser - The authenticated task user making the request
 * @param props.taskId - Unique identifier of the task to update
 * @param props.body - Task update data including new title and status
 * @returns The updated task with all current fields
 * @throws {Error} When the task is not found
 * @throws {Error} When the user is not authorized to update the task
 */
export async function put__minimalTodo_taskUser_tasks_$taskId(props: {
  taskUser: TaskuserPayload;
  taskId: string & tags.Format<"uuid">;
  body: IMinimalTodoTask.IUpdate;
}): Promise<IMinimalTodoTask> {
  const { taskUser, taskId, body } = props;

  // Find the task to update and verify ownership
  const task = await MyGlobal.prisma.minimal_todo_tasks.findFirst({
    where: { id: taskId },
    select: { id: true, taskuser_id: true },
  });

  // Check if task exists
  if (!task) {
    throw new Error("Task not found");
  }

  // Verify ownership - user can only update their own tasks
  if (task.taskuser_id !== taskUser.id) {
    throw new Error("Unauthorized: Cannot update another user's task");
  }

  // Prepare the update data
  const updates = {
    // Update title if provided
    title: body.title ?? undefined,

    // Update status if provided
    status: body.status ?? undefined,

    // Update completed_at based on status changes
    // When status is set to 'complete', set completed_at to current time
    // When status is set to 'incomplete', clear the completed_at timestamp
    completed_at:
      body.status === "complete"
        ? toISOStringSafe(new Date())
        : body.status === "incomplete"
          ? null
          : undefined,
  };

  // Update the task in the database
  const updated = await MyGlobal.prisma.minimal_todo_tasks.update({
    where: { id: taskId },
    data: updates,
  });

  // Return the updated task with properly formatted dates
  // Prisma returns DateTime fields as Date objects, so we convert them to ISO strings
  return {
    id: updated.id,
    title: updated.title,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    completed_at: updated.completed_at
      ? toISOStringSafe(updated.completed_at)
      : null,
  };
}
