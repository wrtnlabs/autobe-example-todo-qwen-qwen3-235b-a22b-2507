import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { BasicuserPayload } from "../../decorators/payload/BasicuserPayload";

/**
 * Basic User Authorization Provider
 * 
 * This function provides JWT-based authentication and authorization for basic users
 * in the Todo list application. It verifies the authenticity of the JWT token and
 * ensures the user is authorized to access protected resources.
 * 
 * The function performs the following steps:
 * 1. Verifies the JWT token using the shared jwtAuthorize function
 * 2. Checks that the payload type matches 'basicuser'
 * 3. Queries the database to verify the user exists and is active
 * 4. Returns the authenticated user payload if all checks pass
 * 
 * The database query includes validation criteria to ensure the user account is
 * active:
 * - Checks that the user's status is 'active'
 * - This prevents banned or suspended users from accessing protected resources
 * 
 * @param request - The HTTP request object containing the Authorization header
 * @returns A promise that resolves to the BasicuserPayload if authentication is successful
 * @throws ForbiddenException if the user is not authorized
 * @throws UnauthorizedException if the token is invalid or missing
 * 
 * @example
 * // This function would typically be called by the BasicuserAuth decorator
 * const user = await basicuserAuthorize(request);
 * // user can now be used in controller methods
 */
export async function basicuserAuthorize(
  request: {
    headers: {
      authorization?: string;
    };
  },
): Promise<BasicuserPayload> {
  const payload: BasicuserPayload = jwtAuthorize({ request }) as BasicuserPayload;

  if (payload.type !== "basicuser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // Check if the basic user exists and is active
  const basicuser = await MyGlobal.prisma.todo_list_basicuser.findFirst({
    where: {
      id: payload.id,
      status: "active"
    },
  });

  if (basicuser === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}
