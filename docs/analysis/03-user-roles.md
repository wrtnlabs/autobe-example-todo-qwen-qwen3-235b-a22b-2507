# User Roles and Permissions Specification for Todo List Application

## User Role Structure

The Todo list application implements a simple user role structure focused on providing minimal functionality for individual task management. The system contains one primary user role that enables users to manage their own tasks within the Todo list application.

### Basic User Role

The **basicUser** role represents an authenticated user who can manage their own tasks within the Todo list application. This role is designed for individual users who need to track personal responsibilities, work items, or daily activities.

**Role Characteristics**:
- Individual ownership of tasks
- Personal responsibility for task management
- No collaboration or sharing capabilities
- Single-user focused experience

Each basicUser has exclusive access to their own task list. Users cannot view, modify, or delete tasks belonging to other users. This ensures data privacy and prevents unauthorized access to personal task information.

The role is intentionally minimal to support the core functionality of the application without introducing unnecessary complexity. There are no administrative roles or elevated privileges in the system, as the application does not require system-wide management capabilities for its intended purpose.

## Authentication Requirements

### Core Authentication Functions

The system implements standard authentication functions to enable secure user access to their personal task lists. Authentication is required for all task management operations.

#### Registration
WHEN a user accesses the Todo list application for the first time, THE system SHALL provide a registration process that collects:
- Email address
- Password

THE registration process SHALL validate that the email address is in proper format and that the password meets minimum security requirements (at least 8 characters).

WHEN a user submits valid registration information, THE system SHALL create a new user account and store the credentials securely using industry-standard password hashing (bcrypt or equivalent).

THE system SHALL check if the email address is already registered before creating a new account.

IF a user attempts to register with an email that is already in use, THEN THE system SHALL reject the registration and return an appropriate error message.

THE system SHALL return a success response when registration is completed.

#### Login
WHEN a user attempts to log in with email and password, THE system SHALL validate the credentials against the stored information.

IF the credentials are valid, THEN THE system SHALL create a new user session and return authentication tokens.

IF the credentials are invalid, THEN THE system SHALL reject the login attempt and return an appropriate error message without revealing whether the email or password was incorrect.

THE system SHALL implement protection against brute force attacks by locking the account after 5 consecutive failed login attempts within 15 minutes.

THE account lock SHALL automatically expire after 15 minutes, allowing the user to try again.

THE system SHALL return an error message to the user when their account is temporarily locked due to multiple failed attempts.

#### Session Management
THE system SHALL maintain user authentication state using JWT (JSON Web Tokens) that are issued upon successful login.

WHEN a user accesses protected endpoints, THE system SHALL validate the presence and validity of the authentication token.

IF the token is missing or invalid, THEN THE system SHALL deny access to the requested resource and return HTTP 401 Unauthorized.

THE system SHALL automatically refresh the user's session when they perform any authenticated action before token expiration.

THE system SHALL issue new tokens with updated expiration times during token refresh.

#### Logout
WHEN an authenticated user requests to log out, THE system SHALL invalidate the current session by removing the refresh token from storage and instructing the client to discard the access token.

THE system SHALL not maintain any active session for the user after logout is completed.

THE system SHALL provide immediate confirmation of successful logout.

THE system SHALL allow users to log out from any device independently.

#### Password Recovery
WHEN a user requests password recovery, THE system SHALL initiate a secure password reset process that:
- Verifies the user's email address exists in the system
- Generates a time-limited reset token (valid for 24 hours)
- Sends a reset link to the user's email address
- Allows the user to create a new password when using the reset link

THE password reset link SHALL include the reset token as a parameter.

THE system SHALL provide an endpoint to validate if a reset token is still active.

WHEN a user submits a new password through the reset process, THE system SHALL validate that the password meets security requirements.

IF a user attempts to use an expired reset token, THEN THE system SHALL deny the password reset request and require the user to initiate a new recovery process.

THE system SHALL invalidate the reset token after successful password change.

THE system SHALL confirm successful password reset to the user.

### Authentication Security Requirements

THE system SHALL transmit all authentication information over HTTPS encrypted connections only.

THE system SHALL implement protection against brute force attacks by temporarily locking accounts after 5 consecutive failed login attempts within 15 minutes.

THE system SHALL hash all passwords using bcrypt with a minimum cost factor of 12 before storing in the database.

THE system SHALL prevent timing attacks on authentication endpoints by using constant-time comparison functions.

THE system SHALL implement CSRF protection for all authentication operations that use cookies.

THE system SHALL set the Secure flag on all authentication-related cookies.

THE system SHALL set the HttpOnly flag on all authentication-related cookies to prevent access via JavaScript.

THE system SHALL implement rate limiting on authentication endpoints to prevent abuse.

THE system SHALL validate the Content-Type header on authentication requests to prevent certain types of attacks.

THE system SHALL not include sensitive user information in authentication error messages.

THE system SHALL use cryptographically secure random number generators for all security tokens.

## Permission Matrix

The following matrix defines the capabilities of the basicUser role across all functional areas of the Todo list application:

| Action | basicUser | Notes |
|--------|----------|-------|
| Create task | ✅ | User can create new tasks in their personal list |
| View own tasks | ✅ | User can view all tasks in their personal list |
| View other users' tasks | ❌ | No cross-user task visibility |
| Update own tasks | ✅ | User can modify task content and status |
| Update other users' tasks | ❌ | No cross-user task modification |
| Delete own tasks | ✅ | User can remove tasks from their personal list |
| Delete other users' tasks | ❌ | No cross-user task deletion |
| Register new account | ✅ | Available to all users (guest access) |
| Login to existing account | ✅ | Available to all registered users |
| Logout from current session | ✅ | Available to all authenticated users |
| Request password reset | ✅ | Available to all users (via email) |
| Change password | ✅ | Available to authenticated users with valid current password |
| Manage session tokens | ✅ | User can revoke active sessions |
| Change email address | ✅ | Authenticated users can update their email |
| Deactivate account | ✅ | Users can request account deletion |
| Access API endpoints | ✅ | All authenticated API access |

This permission structure ensures that users have full control over their personal task management while maintaining strict data isolation between users. The minimal permission set aligns with the application's goal of providing only essential functionality.

## Access Controls

### Task Management Access Controls

WHEN a user attempts to create a new task, THE system SHALL associate the task with the authenticated user's ID and store this ownership information with the task record.

WHEN a user attempts to view their task list, THE system SHALL retrieve only tasks that are associated with the authenticated user's ID.

WHEN a user attempts to update a task, THE system SHALL verify that the task belongs to the authenticated user before allowing modification.

IF a user attempts to update a task that does not belong to them, THEN THE system SHALL deny the request and return HTTP 403 Forbidden.

WHEN a user attempts to delete a task, THE system SHALL verify ownership before deletion.

IF a user attempts to delete a task that does not belong to them, THEN THE system SHALL deny the request and return HTTP 403 Forbidden.

### User Management Access Controls

WHEN an authenticated user attempts to change their password, THE system SHALL verify the current password before allowing the change.

WHEN a user attempts to update their email address, THE system SHALL verify the current password before processing the change.

THE system SHALL send a verification email to the new address when changing email, and the change SHALL only take effect after the user verifies the new email.

WHEN a user attempts to deactivate their account, THE system SHALL require password confirmation before processing the request.

THE system SHALL provide a recovery window of 30 days after account deactivation, during which the user can restore their account.

### Error Handling for Authorization

WHEN an authorization check fails, THE system SHALL return HTTP 403 Forbidden with a generic error message that does not reveal information about the existence or non-existence of specific tasks.

THE system SHALL return consistent error messages for unauthorized access attempts regardless of whether the target resource exists.

THE system SHALL log unauthorized access attempts for security monitoring purposes.

THE system SHALL not expose user enumeration vulnerabilities through different error responses.

THE system SHALL rate limit authorization failure responses to prevent abuse.

## JWT Implementation Requirements

### Token Structure

THE authentication system SHALL use JWT (JSON Web Tokens) for session management with the following payload structure:

```json
{
  "userId": "string (UUID format)",
  "role": "string (basicUser)",
  "permissions": ["string"],
  "iat": "number (issued at timestamp)",
  "exp": "number (expiration timestamp)"
}
```

### JWT Claims

- **userId**: Unique identifier of the authenticated user in UUID format
- **role**: User role name ("basicUser")
- **permissions**: Array of permission strings specific to the user's role
- **iat**: Issued at timestamp in Unix time
- **exp**: Expiration timestamp in Unix time

### Token Management Policies

THE system SHALL issue two tokens upon successful authentication:

1. **Access Token**:
   - Short-lived: expires after 15 minutes
   - Used for accessing protected API endpoints
   - Sent in Authorization header as Bearer token

2. **Refresh Token**:
   - Long-lived: expires after 7 days
   - Stored securely on the server with a reference to the user
   - Used to obtain new access tokens without requiring user credentials
   - Implemented as a random, cryptographically secure string

WHEN an access token expires, THE system SHALL allow users to obtain a new access token by presenting a valid refresh token.

IF a refresh token is compromised or the user requests to revoke access, THE system SHALL invalidate the refresh token on the server.

THE system SHALL implement refresh token rotation by issuing a new refresh token with each use and invalidating the previous one.

THE system SHALL validate the signature of all received JWT tokens before processing.

THE system SHALL check the expiration time of all JWT tokens before allowing access.

THE system SHALL support token revocation through server-side storage of invalid tokens.

### Token Storage

THE access token SHALL be stored in the client application and included in the Authorization header of API requests.

THE refresh token SHALL be stored on the server in a secure data store with appropriate access controls.

Frontend storage recommendations are outside the scope of this backend requirements document, but developers should consider secure storage options such as httpOnly cookies for enhanced security.

THE server SHALL maintain a blacklist of revoked tokens that SHALL be checked on each request.

THE system SHALL implement secure token storage practices on the server with encrypted storage of refresh tokens.

## Security Requirements

### Password Security

THE system SHALL not store passwords in plain text under any circumstances.

THE system SHALL hash all passwords using bcrypt with a minimum cost factor of 12 before storage.

THE system SHALL validate that passwords meet minimum complexity requirements of at least 8 characters upon registration and password changes.

THE system SHALL allow passwords up to 128 characters in length to support password managers.

THE system SHALL support all printable ASCII characters in passwords.

THE system SHALL not impose arbitrary password complexity rules (like requiring numbers or special characters) beyond the minimum length.

THE system SHALL implement secure password reset token generation using cryptographically secure random generators.

THE system SHALL use different salt values for each password hash.

THE system SHALL not allow commonly used passwords by checking against a list of known compromised passwords.

### Session Security

THE system SHALL implement secure session management practices including:

- Using HTTPS for all authentication-related communications
- Setting appropriate token expiration times
- Providing mechanisms for users to revoke active sessions
- Protecting against common web vulnerabilities (XSS, CSRF)

WHEN a user changes their password, THE system SHALL invalidate all active sessions for that user.

WHEN a user revokes access from all devices, THE system SHALL invalidate all refresh tokens associated with that user.

THE system SHALL provide users with a list of active sessions and devices.

THE system SHALL allow users to revoke individual sessions or all sessions at once.

THE system SHALL log all session creation and termination events.

THE system SHALL implement session binding to prevent session fixation attacks.

THE system SHALL validate the integrity of all session tokens.

THE system SHALL implement secure cookie attributes for token storage when used.

THE system SHALL support active session monitoring with anomaly detection.

WHEN a user logs in from a new device or location, THE system SHALL optionally notify the user of the new login activity.

THE system SHALL implement secure session destruction procedures that completely remove all session data.

THE system SHALL prevent concurrent sessions from conflicting with each other.

THE system SHALL implement proper session timeout mechanisms that clear expired sessions.

[See Functional Requirements Document](./02-functional-requirements.md) for detailed requirements on user interactions and task management functions.

[See Service Overview](./01-service-overview.md) for the business context and goals of the Todo list application.

[User interaction scenarios are documented in the User Stories document](./04-user-stories.md).

> *Developer Note: This document defines **business requirements only**. All technical implementations (architecture, APIs, database design, etc.) are at the discretion of the development team.*