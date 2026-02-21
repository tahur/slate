import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { customers } from '../src/lib/server/db/schema/customers';
import { vendors } from '../src/lib/server/db/schema/vendors';
import { organizations } from '../src/lib/server/db/schema/organizations';
import { users } from '../src/lib/server/db/schema/users';

const connectionString = process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL_MIGRATION or DATABASE_URL is required');
}

const client = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false
});
const db = drizzle(client);

async function seed() {
    console.log('Seeding data...');

    // 1. Get Organization and User
    const orgs = await db.select().from(organizations).limit(1);
    if (!orgs.length) {
        console.error('No organization found. Please complete setup in browser first.');
        process.exit(1);
    }
    const org = orgs[0];
    console.log(`Using Organization: ${org.name} (${org.id})`);

    const userList = await db.select().from(users).limit(1);
    const user = userList.length ? userList[0] : null;
    const userId = user ? user.id : null;
    console.log(`Using User: ${user?.email || 'System'} (${userId})`);

    // 2. Customers Data
    const customersData = [
        {
            name: 'Acme Corp',
            email: 'contact@acme.com',
            gst_treatment: 'registered',
            gstin: '29AAACA1234A1Z5',
            place_of_supply: '29', // Karnataka
            state_code: '29',
            billing_address: '123 Acme Ind. Estate, Bangalore',
            city: 'Bangalore',
            pincode: '560001'
        },
        {
            name: 'Gamma Systems',
            email: 'info@gamma.com',
            gst_treatment: 'registered',
            gstin: '27ABCDE1234F1Z5',
            place_of_supply: '27', // Maharashtra
            state_code: '27',
            billing_address: '456 Gamma Tower, Mumbai',
            city: 'Mumbai',
            pincode: '400001'
        },
        {
            name: 'Local Retailer',
            email: 'shop@local.com',
            gst_treatment: 'unregistered',
            place_of_supply: '29',
            state_code: '29',
            billing_address: '77 Market Road, Bangalore',
            city: 'Bangalore',
            pincode: '560002'
        },
        {
            name: 'John Doe',
            email: 'john@gmail.com',
            gst_treatment: 'consumer',
            place_of_supply: '29',
            state_code: '29',
            billing_address: 'Flat 101, Residency, Bangalore',
            city: 'Bangalore',
            pincode: '560003'
        },
        {
            name: 'Tech Startups',
            email: 'hello@startup.com',
            gst_treatment: 'registered',
            gstin: '29XYZDE1234F1Z5',
            place_of_supply: '29',
            state_code: '29',
            billing_address: 'Coworking Hub, Bangalore',
            city: 'Bangalore',
            pincode: '560004'
        }
    ];

    // 3. Vendors Data
    const vendorsData = [
        {
            name: 'Chipset Wholesalers',
            email: 'sales@chipset.com',
            gst_treatment: 'registered',
            gstin: '29ZZZQA1234A1Z5',
            state_code: '29',
            address: 'Electronics City, Bangalore',
            city: 'Bangalore',
            pincode: '560100'
        },
        {
            name: 'Office Depot',
            email: 'sales@officedepot.com',
            gst_treatment: 'registered',
            gstin: '27ZZZQA1234A1Z5',
            state_code: '27',
            address: 'Nariman Point, Mumbai',
            city: 'Mumbai',
            pincode: '400021'
        },
        {
            name: 'Freelance Dev',
            email: 'dev@freelance.com',
            gst_treatment: 'unregistered',
            state_code: '29',
            address: 'Home Office, Bangalore',
            city: 'Bangalore',
            pincode: '560005'
        },
        {
            name: 'Cloud Hosting Ltd',
            email: 'billing@cloud.com',
            gst_treatment: 'registered',
            gstin: '07AAACA1234A1Z5',
            state_code: '07', // Delhi
            address: 'Cyber City, Delhi',
            city: 'Delhi',
            pincode: '110001'
        },
        {
            name: 'Logistics Pro',
            email: 'logistic@pro.com',
            gst_treatment: 'registered',
            gstin: '29AAACA5678A1Z5',
            state_code: '29',
            address: 'Transport Nagar, Bangalore',
            city: 'Bangalore',
            pincode: '560022'
        }
    ];

    // Insert Customers
    for (const c of customersData) {
        const id = crypto.randomUUID();
        try {
            await db.insert(customers).values({
                id,
                org_id: org.id,
                name: c.name,
                email: c.email,
                gst_treatment: c.gst_treatment,
                gstin: c.gstin,
                place_of_supply: c.place_of_supply,
                state_code: c.state_code,
                billing_address: c.billing_address,
                city: c.city,
                pincode: c.pincode,
                created_by: userId,
                updated_by: userId
            });
            console.log(`Added customer: ${c.name}`);
        } catch (e) {
            console.error(`Error adding customer ${c.name}:`, e.message);
        }
    }

    // Insert Vendors
    for (const v of vendorsData) {
        const id = crypto.randomUUID();
        try {
            await db.insert(vendors).values({
                id,
                org_id: org.id,
                name: v.name,
                email: v.email,
                gst_treatment: v.gst_treatment,
                gstin: v.gstin,
                state_code: v.state_code,
                address: v.address,
                city: v.city,
                pincode: v.pincode,
                created_by: userId,
                updated_by: userId
            });
            console.log(`Added vendor: ${v.name}`);
        } catch (e) {
            console.error(`Error adding vendor ${v.name}:`, e.message);
        }
    }

    console.log('Seeding completed!');
}

try {
    await seed();
} catch (error) {
    console.error(error);
} finally {
    await client.end({ timeout: 5 });
}
