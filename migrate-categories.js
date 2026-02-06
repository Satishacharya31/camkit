const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting migration to categories...');

    // Get all unique subjects from content
    const contents = await prisma.content.findMany({
        select: { subject: true, subjectSlug: true },
        distinct: ['subject'],
    });

    console.log(`Found ${contents.length} unique subjects`);

    const subjectColors = {
        'Physics': 'bg-purple-500',
        'Chemistry': 'bg-teal-500',
        'Biology': 'bg-emerald-500',
        'Computer Science': 'bg-orange-500',
        'Mathematics': 'bg-blue-500',
        'General': 'bg-gray-500',
    };

    for (const item of contents) {
        const { subject, subjectSlug } = item;

        // Create or find category
        const category = await prisma.category.upsert({
            where: { name: subject },
            update: {},
            create: {
                name: subject,
                slug: subjectSlug,
                color: subjectColors[subject] || 'bg-indigo-500',
                description: `All ${subject} projects and experiments`,
            },
        });

        console.log(`Created/Found category: ${category.name}`);

        // Update contents to link to this category
        const updated = await prisma.content.updateMany({
            where: { subject: subject },
            data: { categoryId: category.id },
        });

        console.log(`Updated ${updated.count} contents for category ${category.name}`);
    }

    console.log('Migration complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
