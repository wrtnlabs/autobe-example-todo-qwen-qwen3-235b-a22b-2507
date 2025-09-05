import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { TaskuserPayload } from "../../decorators/payload/TaskuserPayload";

export async function taskuserAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<TaskuserPayload> {
  const payload: TaskuserPayload = jwtAuthorize({ request }) as TaskuserPayload;

  if (payload.type !== "taskUser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  const taskuser = await MyGlobal.prisma.minimal_todo_taskusers.findFirst({
    where: {
      id: payload.id,
      deleted_at: null,
    },
  });

  if (taskuser === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}