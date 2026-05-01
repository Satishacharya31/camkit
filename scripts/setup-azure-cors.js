/**
 * Run once to configure Azure Blob Storage CORS rules.
 * This allows the browser to PUT files directly to Azure without going through Vercel.
 *
 * Usage:
 *   node scripts/setup-azure-cors.js
 */

require('dotenv').config({ path: '.env' });
const { BlobServiceClient } = require('@azure/storage-blob');

async function main() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        console.error('❌  AZURE_STORAGE_CONNECTION_STRING not set in .env');
        process.exit(1);
    }

    const client = BlobServiceClient.fromConnectionString(connectionString);

    const corsRules = [
        {
            allowedOrigins: '*',                          // tighten to your domain in production
            allowedMethods: 'GET,PUT,HEAD,OPTIONS',
            allowedHeaders: '*',
            exposedHeaders: 'ETag,x-ms-request-id,Content-Length',
            maxAgeInSeconds: 3600,
        },
    ];

    await client.setProperties({
        cors: corsRules,
    });

    console.log('✅  Azure Blob Storage CORS configured successfully.');
    console.log('   Allowed methods: GET, PUT, HEAD, OPTIONS');
    console.log('   Allowed origins: * (all)');
}

main().catch((err) => {
    console.error('❌  Failed to configure CORS:', err.message);
    process.exit(1);
});
