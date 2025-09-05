import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { TaskuserPayload } from "../decorators/payload/TaskuserPayload";

export async function delete__minimalTodo_taskUser_tasks_$taskId(props: {
  taskUser: TaskuserPayload;
  taskId: string & tags.Format<"uuid">;
}): Promise<void> {
  // Extract parameters
  const { taskUser, taskId } = props;

  // Verify the task exists and belongs to the authenticated user
  const task = await MyGlobal.prisma.minimal_todo_tasks.findFirstOrThrow({
    where: {
      id: taskId,
      taskuser_id: taskUser.id,
    },
  });

  // Delete the task (CASCADE deletion will be handled by the database)
  await MyGlobal.prisma.minimal_todo_tasks.delete({
    where: {
      id: task.id,
    },
  });
}
