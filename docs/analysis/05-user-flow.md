> The minimalTodo application requires comprehensive user flow documentation that captures all user interactions from authentication to task management. This documentation should provide backend developers with clear understanding of the business processes without specifying technical implementation.

> ### Introduction
> The user flow documentation describes the step-by-step interactions between the user and system for all core functionality of the minimalTodo application. These flows represent the complete journey for authenticated users performing task management activities.

> ### Authentication Flow
> The authentication process enables users to securely access their todo tasks. This flow begins when a user attempts to log in to the system and continues until they gain access or encounter authentication issues. The flow must accommodate both successful authentication and various failure scenarios including invalid credentials and account lockout conditions.

> ### Task Creation Flow
> This flow describes the process for adding new tasks to the system. It begins when a user initiates task creation and continues through input submission, validation, and confirmation. The flow must address both successful task creation and validation failures for required fields.

> ### Task Update Flow
> The task update process allows users to modify existing task details. This includes editing task descriptions, updating status, and making other changes to task properties. The flow must handle both successful updates and validation errors.

> ### Task Completion Flow
> This specific flow manages the process of marking tasks as complete. It involves user initiation, system validation, status update, and confirmation. The flow should be optimized for efficiency as it represents a common user action.

> ### Error Recovery Flows
> When users provide invalid input or encounter system errors, the application must guide them through recovery. These flows ensure users can correct mistakes and continue their tasks without confusion or data loss.

> ### Application Logout
> The logout process provides users with a way to securely end their session. This flow ensures proper session termination and system state cleanup.

> The application contains one user role:
> - taskUser: Authenticated user with full CRUD capabilities for their own tasks

> The documentation should reflect that all operations are scoped to the authenticated user's own tasks only, with no sharing or collaboration features in this minimal implementation.