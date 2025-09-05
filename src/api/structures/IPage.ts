import { tags } from "typia";

import { IMinimalTodoTask } from "./IMinimalTodoTask";

export namespace IPage {
  export namespace IMinimalTodoTask {
    /**
     * Paginated collection of task summaries.
     *
     * Follows the fixed IPage structure with pagination metadata and data
     * array. Contains the result of a task search operation with filtering,
     * sorting, and pagination applied.
     *
     * The data field contains IMinimalTodoTask.ISummary objects, providing
     * lightweight task representations for list displays.
     *
     * This structure ensures consistent pagination handling across all
     * paginated endpoints while minimizing data transfer for improved
     * performance.
     */
    export type ISummary = {
      /**
       * Pagination information including current page, records per page,
       * total records, and total pages.
       */
      pagination: IPage.IPagination;

      /** Array of task summary records matching the search criteria. */
      data: IMinimalTodoTask.ISummary[];
    };
  }

  /**
   * Pagination metadata for list responses.
   *
   * Contains all information needed to navigate paginated results, including
   * current position, page size, and total counts.
   *
   * This standard structure is used across all paginated responses for
   * consistency.
   */
  export type IPagination = {
    /** Current page number. */
    current: number & tags.Type<"int32">;

    /** Limitation of records per page. */
    limit: number & tags.Type<"int32">;

    /** Total records in the database matching the criteria. */
    records: number & tags.Type<"int32">;

    /** Total pages available. */
    pages: number & tags.Type<"int32">;
  };
}
