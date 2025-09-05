import { Module } from "@nestjs/common";

import { AuthTaskuserController } from "./controllers/auth/taskUser/AuthTaskuserController";
import { AuthTaskuserPasswordResetsController } from "./controllers/auth/taskUser/password/resets/AuthTaskuserPasswordResetsController";
import { MinimaltodoTaskuserTasksController } from "./controllers/minimalTodo/taskUser/tasks/MinimaltodoTaskuserTasksController";

@Module({
  controllers: [
    AuthTaskuserController,
    AuthTaskuserPasswordResetsController,
    MinimaltodoTaskuserTasksController,
  ],
})
export class MyModule {}
