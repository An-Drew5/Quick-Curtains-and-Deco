-- List tables related to Prisma migrations
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name ILIKE '%prisma%'
ORDER BY table_schema, table_name;

-- If _prisma_migrations exists, show recent entries
SELECT * FROM public._prisma_migrations ORDER BY finished_at DESC LIMIT 20;