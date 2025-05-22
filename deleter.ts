import type { Knex } from 'knex'
import { knex } from 'knex'

// Configure your PostgreSQL connection
const db: Knex = knex({
  client: 'pg',
  connection: {
    host: 'your-postgres-host',
    port: 5432,
    user: 'your-username',
    password: 'your-password',
    database: 'your-database-name',
  },
  pool: {
    min: 2,
    max: 10,
  },
})

async function dropTables() {
  try {
    console.log('Starting to drop tables...')

    // Drop tables in proper order to handle foreign key constraints
    await db.schema.dropTableIfExists('knex_migrations_plan_service')
    await db.schema.dropTableIfExists('knex_migrations_plan_service_lock')
    await db.schema.dropTableIfExists('plan_train_helper')
    await db.schema.dropTableIfExists('plan_records')
    await db.schema.dropTableIfExists('plan_templates')
    await db.schema.dropTableIfExists('plan_techniques')
    await db.schema.dropTableIfExists('plan_exercises')
    await db.schema.dropTableIfExists('plan_systems')
    await db.schema.dropTableIfExists('plan_system_methods')
    await db.schema.dropTableIfExists('plan_categories')
    await db.schema.dropTableIfExists('plan_system_method_number_helper')
    await db.schema.dropTableIfExists('plan_system_number_helper')

    console.log('All tables dropped successfully!')
  } catch (error) {
    console.error('Error dropping tables:', error)
    throw error
  } finally {
    // Close the database connection
    await db.destroy()
    console.log('Database connection closed.')
  }
}

// Execute the function
dropTables().catch(err => {
  console.error('Script failed:', err)
  process.exit(1)
})
