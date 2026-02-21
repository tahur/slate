import { db } from '$lib/server/db';
import { audit_log } from '$lib/server/db/schema';
import { logger, logDomainEvent } from '$lib/server/platform/observability';

export type EntityType =
    | 'invoice'
    | 'payment'
    | 'expense'
    | 'credit_note'
    | 'customer'
    | 'vendor'
    | 'journal_entry'
    | 'settings'
    | 'item';

export type ActionType =
    | 'created'
    | 'updated'
    | 'deleted'
    | 'issued'
    | 'cancelled'
    | 'paid'
    | 'partially_paid'
    | 'applied'
    | 'voided'
    | 'activated'
    | 'deactivated';

export interface LogActivityParams {
    orgId: string;
    userId: string;
    entityType: EntityType;
    entityId: string;
    action: ActionType;
    changedFields?: Record<string, { old?: unknown; new?: unknown }>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log an activity to the audit log.
 * This should be called after successful operations to maintain an audit trail.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await db.insert(audit_log).values({
            id: crypto.randomUUID(),
            org_id: params.orgId,
            entity_type: params.entityType,
            entity_id: params.entityId,
            action: params.action,
            changed_fields: params.changedFields ? JSON.stringify(params.changedFields) : null,
            user_id: params.userId,
            ip_address: params.ipAddress || null,
            user_agent: params.userAgent || null
        });

        logDomainEvent('audit.activity.logged', {
            entityType: params.entityType,
            entityId: params.entityId,
            action: params.action
        });
    } catch (error) {
        // Log errors but don't throw - audit logging should never break the main operation
        logger.warn('audit_log_failed', {
            entityType: params.entityType,
            entityId: params.entityId,
            action: params.action
        }, error);
    }
}

/**
 * Helper to create a human-readable description of an activity
 */
export function formatActivityDescription(
    action: ActionType,
    entityType: EntityType,
    entityNumber?: string
): string {
    const entityLabel = entityType.replace('_', ' ');
    const ref = entityNumber ? ` ${entityNumber}` : '';

    switch (action) {
        case 'created':
            return `Created ${entityLabel}${ref}`;
        case 'updated':
            return `Updated ${entityLabel}${ref}`;
        case 'deleted':
            return `Deleted ${entityLabel}${ref}`;
        case 'issued':
            return `Issued ${entityLabel}${ref}`;
        case 'cancelled':
            return `Cancelled ${entityLabel}${ref}`;
        case 'paid':
            return `Marked ${entityLabel}${ref} as paid`;
        case 'partially_paid':
            return `Recorded partial payment for ${entityLabel}${ref}`;
        case 'applied':
            return `Applied ${entityLabel}${ref}`;
        case 'voided':
            return `Voided ${entityLabel}${ref}`;
        default:
            return `${action} ${entityLabel}${ref}`;
    }
}
