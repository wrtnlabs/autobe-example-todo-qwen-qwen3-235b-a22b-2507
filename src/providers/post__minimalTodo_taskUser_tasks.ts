import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMinimalTodoTask } from "@ORGANIZATION/PROJECT-api/lib/structures/IMinimalTodoTask";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

/**
 * Create a new task for the authenticated user with a title and initial
 * incomplete status.
 *
 * This operation allows users to capture new work items quickly, supporting the
 * core use case of task creation with minimal friction. The system
 * automatically assigns a unique identifier and creation timestamp, with the
 * task defaulting to incomplete status.
 *
 * The operation validates input against business rules, ensuring task titles
 * are provided and do not exceed 100 characters. Security considerations ensure
 * proper user context and data isolation, with the system automatically
 * associating the new task with the authenticated user.
 *
 * Performance expectations ensure immediate task creation with visual feedback
 * appearing within 200ms of submission, supporting the application's
 * responsiveness requirements. The operation supports the key user scenario of
 * capturing tasks during meetings or other time-sensitive situations where
 * speed is essential.
 *
 * @param props - Request properties
 * @param props.taskUser - The authenticated user creating the task
 * @param props.body - Task creation data including title (required)
 * @returns The created task with all system-assigned fields
 * @throws {Error} When the user account cannot be found in the system
 */
export async function post__minimalTodo_taskUser_tasks(props: {
  taskUser: TaskuserPayload;
  body: IMinimalTodoTask.ICreate;
}): Promise<IMinimalTodoTask> {
  const { taskUser, body } = props;

  // Generate UUID for new task
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  // Create task with required fields
  const created = await MyGlobal.prisma.minimal_todo_tasks.create({
    data: {
      id,
      taskuser_id: taskUser.id,
      title: body.title,
      status: "incomplete",
      created_at: now,
    },
  });

  return {
    id: created.id,
    taskuser_id: created.taskuser_id,
    title: created.title,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    completed_at: created.completed_at
      ? toISOStringSafe(created.completed_at)
      : null,
  };
}
