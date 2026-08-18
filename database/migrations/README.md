# Database migrations

Apply migrations in filename order.

`002_public_checkout_flow.sql` extends the original MVP schema for the public purchase flow with customer email, order shipping snapshots, supported delivery/payment methods, shipping fee, and a private public confirmation token.

After applying the SQL migration, run the project's normal Prisma generation command in the deployment environment so the generated client matches `prisma/schema.prisma`. The current source intentionally uses raw SQL only for the newly added columns so the checked-in generated client remains backward-compatible until regeneration.
