import { pgTable, text, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const payment_accounts = pgTable(
    'payment_accounts',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        label: text('label').notNull(),
        kind: text('kind').notNull(), // bank, cash
        ledger_code: text('ledger_code').notNull(), // 1100 (bank/upi/card/cheque), 1000 (cash)
        bank_name: text('bank_name'),
        account_number_last4: text('account_number_last4'),
        ifsc: text('ifsc'),
        upi_id: text('upi_id'),
        card_label: text('card_label'),
        is_active: boolean('is_active').default(true),
        is_default_receive: boolean('is_default_receive').default(false),
        is_default_pay: boolean('is_default_pay').default(false),
        sort_order: integer('sort_order').default(0),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        orgIdx: index('idx_payment_accounts_org').on(t.org_id),
        activeIdx: index('idx_payment_accounts_org_active').on(t.org_id, t.is_active),
        orgLabelUnq: uniqueIndex('idx_payment_accounts_org_label').on(t.org_id, t.label)
    })
);
