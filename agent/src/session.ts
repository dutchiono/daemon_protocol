/**
 * @title Session Management
 * @notice Manage agent sessions for users
 */

export interface Session {
    id: string;
    walletAddress: string;
    createdAt: number;
    lastActivity: number;
    context?: Record<string, any>;
}

const sessions = new Map<string, Session>();

/**
 * Create a new session
 */
export function createSession(walletAddress: string): Session {
    const session: Session = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        walletAddress,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        context: {},
    };

    sessions.set(session.id, session);
    return session;
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
}

/**
 * Update session activity
 */
export function updateSessionActivity(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session) {
        session.lastActivity = Date.now();
    }
}

/**
 * Update session context
 */
export function updateSessionContext(sessionId: string, context: Record<string, any>): void {
    const session = sessions.get(sessionId);
    if (session) {
        session.context = { ...session.context, ...context };
    }
}

/**
 * Clean up old sessions (older than 1 hour)
 */
export function cleanupSessions(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, session] of sessions.entries()) {
        if (session.lastActivity < oneHourAgo) {
            sessions.delete(id);
        }
    }
}

