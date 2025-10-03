import { Module } from "@nestjs/common";

import { TodolistBasicuserTasksController } from "./controllers/todoList/basicUser/tasks/TodolistBasicuserTasksController";

@Module({
  controllers: [TodolistBasicuserTasksController],
})
export class MyModule {}
