import { tags } from "typia";

/**
 * Basic User Authentication Payload
 *
 * This interface defines the structure of the JWT payload for authenticated
 * basic users in the Todo list application. It contains the essential
 * information needed to identify and authorize basic users across the system.
 *
 * The payload includes:
 *
 * - Id: The primary identifier of the basic user
 * - Type: A discriminator field that identifies this payload as belonging to a
 *   basic user
 *
 * This payload is created during the authentication process and is verified on
 * each subsequent request to ensure the user is authorized to access protected
 * resources.
 *
 * @example
 *   // Example JWT payload
 *   {
 *   "id": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
 *   "type": "basicuser"
 *   }
 */
export interface BasicuserPayload {
  /**
   * The unique identifier of the basic user. This is the same as the id field
   * in the todo_list_basicuser table.
   *
   * @format uuid
   */
  id: string & tags.Format<"uuid">;

  /**
   * Discriminator field that identifies the type of user. For basic users, this
   * value is always "basicuser". This field is used to distinguish between
   * different user types in a discriminated union type.
   */
  type: "basicuser";
}
