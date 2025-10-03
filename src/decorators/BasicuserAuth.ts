import { SwaggerCustomizer } from "@nestia/core";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Singleton } from "tstl";

import { basicuserAuthorize } from "../providers/authorize/basicuserAuthorize";

/**
 * BasicUser Authentication Decorator
 * 
 * This decorator handles JWT-based authentication for basic users in the Todo list application.
 * It automatically verifies bearer tokens in the Authorization header and injects the
 * authenticated BasicUser payload into controller methods.
 * 
 * The decorator performs the following functions:
 * - Adds bearer token security to Swagger documentation
 * - Extracts and verifies JWT token from Authorization header
 * - Validates that the token's type is 'basicUser'
 * - Queries the database to verify the user exists and is active
 * - Returns the authenticated user payload
 * 
 * @example
 * // In a controller method
 * @Get('tasks')
 * async getTasks(@BasicuserAuth() user: BasicuserPayload) {
 *   // user contains the authenticated basic user's payload
 *   return this.taskService.getTasks(user.id);
 * }
 */
export const BasicuserAuth =
  (): ParameterDecorator =>
  (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ): void => {
    SwaggerCustomizer((props) => {
      props.route.security ??= [];
      props.route.security.push({
        bearer: [],
      });
    })(target, propertyKey as string, undefined!);
    singleton.get()(target, propertyKey, parameterIndex);
  };

const singleton = new Singleton(() =>
  createParamDecorator(async (_0: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return basicuserAuthorize(request);
  })(),
);