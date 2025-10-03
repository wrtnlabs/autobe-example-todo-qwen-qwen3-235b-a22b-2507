import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";

export namespace ITodoListBasicUser {
  /**
   * User registration data containing email and password.
   *
   * This schema represents the data required to register a new basicUser
   * account in the todoList application. It captures the essential
   * information needed to create a user profile with secure authentication.
   *
   * The email serves as the unique identifier for the user and is used for
   * login, account recovery, and system communications. It must be in valid
   * email format to ensure deliverability and uniqueness within the system.
   *
   * The password is collected in plain text through secure HTTPS connections
   * and is never stored as-is. The backend system will apply BCrypt hashing
   * with appropriate salt before persisting it in the
   * todo_list_basicuser.password_hash field, ensuring password security even
   * in the event of database compromise.
   *
   * This registration process is the first step in establishing a user's
   * identity, enabling them to manage their personal tasks while the system
   * maintains data privacy through exclusive ownership of their task list.
   * The minimal information requirement aligns with the application's focus
   * on simplicity and ease of use.
   */
  export type ICreate = {
    /**
     * Unique email address used for registration and authentication to
     * establish the user's identity in the system.
     */
    email: string & tags.Format<"email">;

    /**
     * Plain text password that will be securely hashed using BCrypt before
     * storage in the system for authentication purposes.
     */
    password: string & tags.MinLength<8>;
  };

  /**
   * Authorization response containing JWT token.
   *
   * This response is returned after successful authentication operations such
   * as login, registration, or token refresh. It contains the essential
   * information needed for the client to establish and maintain an
   * authenticated session.
   *
   * The ID provides a unique reference to the authenticated user within the
   * system, allowing for personalization and ownership of resources like
   * tasks. The JWT token contains encoded authentication data with a defined
   * expiration, enabling stateless authentication for subsequent API
   * requests.
   *
   * The inclusion of user details like email and status in the response
   * allows the client application to immediately personalize the user
   * interface without requiring an additional profile fetch operation,
   * improving the user experience and reducing round trips to the server.
   *
   * This structure enables complete JWT token lifecycle management while
   * providing immediate access to basic user information necessary for
   * frontend rendering and authorization decisions.
   */
  export type IAuthorized = {
    /**
     * Unique identifier of the authenticated user that establishes their
     * identity across the system.
     */
    id: string & tags.Format<"uuid">;

    /**
     * Email address associated with the authenticated user account for
     * identification and communication purposes.
     */
    email: string & tags.Format<"email">;

    /**
     * Current status of the user account that indicates whether they can
     * actively use the system (active, suspended, etc).
     */
    status: string;

    /**
     * Timestamp when the user account was created.
     *
     * The `created_at` means the date and time when the user account was
     * initially created.
     */
    created_at: string & tags.Format<"date-time">;

    /**
     * Timestamp when the user account was last updated.
     *
     * The `updated_at` means the date and time when the user account was
     * last updated.
     */
    updated_at: string & tags.Format<"date-time">;

    /** JWT token information for authentication */
    token: IAuthorizationToken;
  };

  /**
   * User login credentials (email and password).
   *
   * This schema defines the data structure for user authentication in the
   * todoList application. It captures the essential credentials needed to
   * verify a user's identity and establish a session.
   *
   * The email field serves as the username identifier, uniquely identifying
   * the user account in the system. It must match the email used during
   * registration exactly, including case sensitivity depending on system
   * configuration.
   *
   * The password is provided in plain text by the client through secure HTTPS
   * connections. The backend system will retrieve the corresponding
   * password_hash from the todo_list_basicuser table and use BCrypt
   * comparison to verify the credentials without ever handling the plain text
   * password directly.
   *
   * This login mechanism follows standard security practices by using
   * industry-standard password hashing (BCrypt) and secure transmission
   * (HTTPS). The system implements protection against brute force attacks by
   * temporarily locking accounts after multiple failed attempts.
   *
   * The minimal credential requirement aligns with the application's focus on
   * simplicity, avoiding complex multi-factor authentication for this basic
   * user role while still providing adequate security for personal task
   * management.
   */
  export type ILogin = {
    /**
     * Registered email address used as the username for authentication to
     * identify the user in the system.
     */
    email: string & tags.Format<"email">;

    /**
     * User's password in plain text that will be verified against the
     * stored hash for authentication purposes.
     */
    password: string;
  };

  /**
   * Refresh token for obtaining new authentication tokens.
   *
   * This schema represents the data needed to refresh an expired access token
   * and maintain an authenticated session. It enables users to continue using
   * the application without repeatedly logging in.
   *
   * The refresh token is a long-lived credential (typically 7 days) that is
   * securely stored on the server in the todo_list_basicuser_sessions table.
   * When a user's short-lived access token expires (typically 15 minutes),
   * they can use this refresh token to obtain a new access token.
   *
   * The refresh mechanism implements security best practices through token
   * rotation - each refresh generates a new refresh token and invalidates the
   * previous one. This limits the lifespan of any compromised token and
   * provides a defense against replay attacks.
   *
   * By separating short-lived access tokens from long-lived refresh tokens,
   * the system reduces the attack surface while maintaining a good user
   * experience. The refresh token itself is never used to access protected
   * resources directly, only to obtain new access tokens.
   *
   * This approach balances security and usability, preventing constant
   * re-authentication while minimizing the risk associated with long-lived
   * authentication credentials.
   */
  export type IRefresh = {
    /**
     * Valid refresh token that allows obtaining new access tokens without
     * re-entering credentials.
     */
    refreshToken: string;
  };

  /**
   * Email address for initiating password recovery.
   *
   * This schema represents the data needed to start the password reset
   * process for a user account. It contains only the essential information
   * required to verify account existence and initiate recovery.
   *
   * The email field identifies the account for which password recovery is
   * requested. The system will check if a user with this email exists in the
   * database before proceeding with the recovery process.
   *
   * Security considerations include not revealing whether an email is
   * registered in the system. The response will be identical regardless of
   * whether the email exists, preventing user enumeration attacks. This
   * protects user privacy by not disclosing account information to potential
   * attackers.
   *
   * When a valid email is provided, the system generates a cryptographically
   * secure token and sends a password reset link to the associated email
   * address. This link includes the token as a parameter and is valid for a
   * limited time (typically 24 hours).
   *
   * The process follows security best practices by using time-limited,
   * single-use tokens and sending recovery instructions to the verified email
   * address, ensuring that only the legitimate account owner can reset their
   * password.
   *
   * This simple schema aligns with the application's focus on usability while
   * maintaining strong security controls for account recovery.
   */
  export type IRequestPasswordReset = {
    /**
     * Registered email address for which password recovery should be
     * initiated.
     */
    email: string & tags.Format<"email">;
  };

  /**
   * Confirmation of password reset request initiation.
   *
   * This response schema provides feedback after a password reset request is
   * submitted. It indicates whether the request was processed successfully,
   * without disclosing information about the existence of the email account.
   *
   * The success field will always be true when the request is properly
   * formatted and processed, even if the email does not correspond to a
   * registered account. This deliberate design prevents user enumeration
   * attacks where attackers could determine which email addresses are
   * registered in the system.
   *
   * By returning the same response for both existing and non-existing
   * accounts, the system protects user privacy and security. Users who have
   * accounts will receive a reset email if they entered their correct email
   * address, while those who don't have accounts will simply not receive
   * anything.
   *
   * This approach follows security best practices for password recovery
   * flows, balancing usability with protection against automated attacks.
   * Legitimate users can safely request password resets without worrying
   * about exposing their account status, while the system remains resilient
   * against reconnaissance attempts by malicious actors.
   *
   * The simplicity of this response aligns with the application's minimalist
   * design philosophy, providing necessary feedback without unnecessary
   * complexity or information disclosure.
   */
  export type IRequestPasswordResetResponse = {
    /**
     * Indicates whether the password reset request was accepted, regardless
     * of whether the email exists.
     */
    success: boolean;
  };

  /**
   * Password reset token to validate.
   *
   * This schema contains the token that needs to be verified for the password
   * reset process. It represents the identifier extracted from the password
   * reset link that was emailed to the user.
   *
   * The token field holds the cryptographically secure string that was
   * generated when the user requested password recovery. This token is stored
   * in the todo_list_password_reset_tokens table along with expiration and
   * usage information.
   *
   * Validation checks several criteria to ensure the token can be used
   * safely:
   *
   * - The token matches an existing record in the database
   * - The current time is before the token's expiration time (typically 24
   *   hours from creation)
   * - The token has not been previously used (used_at is null)
   * - The token has not been revoked (deleted_at is null)
   *
   * This validation step is crucial for security, ensuring that users cannot
   * reuse tokens after they have been used or expired. It prevents replay
   * attacks and ensures that each recovery request can only be completed
   * once.
   *
   * The frontend typically calls this endpoint before displaying the password
   * reset form to provide immediate feedback on whether the recovery process
   * can proceed, improving the user experience by catching expired or invalid
   * tokens early.
   */
  export type IValidatePasswordResetToken = {
    /** Password reset token to validate for active status and usability. */
    token: string;
  };

  /**
   * Result of password reset token validation check.
   *
   * This response schema provides the outcome of validating a password reset
   * token. It indicates whether the token is currently active and available
   * for use in the password recovery process.
   *
   * The valid field will be true only if the token exists in the system, has
   * not expired, has not been used previously, and has not been revoked. If
   * any of these conditions are not met, the field will be false.
   *
   * This simple boolean response prevents information leakage about why a
   * token might be invalid. Whether a token is expired, already used,
   * revoked, or simply does not exist, the response remains the same. This
   * protects against enumeration attacks and timing attacks that could be
   * used to gather information about the system.
   *
   * The response enables the client application to determine whether to
   * proceed with the password reset flow. If valid is true, the application
   * can display the password change form. If valid is false, it can show an
   * appropriate error message guiding the user to request a new reset link.
   *
   * This validation step enhances security by ensuring that only legitimate,
   * time-limited recovery requests can proceed to the actual password change
   * stage, while maintaining a simple interface that doesn't expose internal
   * system details.
   */
  export type IValidatePasswordResetTokenResponse = {
    /**
     * Indicates whether the provided reset token is currently valid and can
     * be used for password reset.
     */
    valid: boolean;
  };

  /**
   * New password and reset token for completing password reset.
   *
   * This schema contains the information needed to finalize the password
   * recovery process. It combines authentication (via the reset token) with
   * the new credential (the password).
   *
   * The token field provides the authentication factor that verifies the
   * user's identity through possession of the reset link sent to their email.
   * This ensures that only someone with access to the registered email can
   * change the password.
   *
   * The password field contains the new credential that will replace the
   * current one. It must meet the system's minimum security requirements (at
   * least 8 characters) to ensure account security is maintained.
   *
   * Security measures include:
   *
   * - Server-side validation that the token is valid and unused
   * - BCrypt hashing of the new password before storage
   * - Invalidating the reset token after use to prevent reuse
   * - Invalidating all existing sessions for the user as a security measure
   *
   * This two-step process (request token via email, then use token to set new
   * password) follows industry best practices for secure password recovery,
   * balancing security with usability for legitimate users.
   */
  export type ICompletePasswordReset = {
    /**
     * Valid reset token that was emailed to the user for authentication in
     * the password recovery process.
     */
    token: string;

    /**
     * New password for the account that will replace the current one after
     * validation.
     */
    password: string & tags.MinLength<8>;
  };

  /**
   * Confirmation of successful password reset completion.
   *
   * This response schema indicates the outcome of attempting to change a
   * password using a reset token. It provides simple feedback on whether the
   * operation was successful.
   *
   * The success field will be true if the token was valid, the new password
   * met requirements, and the password was successfully updated in the
   * database. If any part of the process failed (invalid token, weak
   * password, database error), the field will be false.
   *
   * Upon successful password reset, the system takes additional security
   * measures:
   *
   * - The reset token is marked as used (used_at timestamp set)
   * - All existing sessions for the user are invalidated, requiring
   *   re-authentication
   * - An audit log is created to record the security-sensitive operation
   *
   * This response allows the client application to inform the user of the
   * outcome and guide them to log in with their new credentials. The
   * simplicity of the response follows the principle of least information
   * disclosure, not revealing specific reasons for failure to prevent
   * enumeration attacks.
   *
   * The immediate invalidation of existing sessions is a critical security
   * feature that protects against scenarios where an attacker might have
   * compromised the user's session while the legitimate user is recovering
   * access.
   */
  export type ICompletePasswordResetResponse = {
    /** Indicates whether the password reset was completed successfully. */
    success: boolean;
  };
}
