import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('plan_records')
  if (!tableExists) {
    await knex.schema.createTable('plan_records', (table) => {
      table.uuid('id').primary() // Changed to integer with auto-increment
      table.integer('student_id').notNullable() // Added student_id
      table.integer('student_age').notNullable() // Added student_age
      table.timestamp('created_at').defaultTo(knex.fn.now()) // Added created_at with default
      table.text('workout_plan'); // Added workout_plan
      table.integer('student_weight'); // Added student_weight
      table.string('target', 255).notNullable(); // Added target
      table.string('student_level', 255).notNullable(); // Added student_level
      table.timestamp('createdat', { useTz: true }).defaultTo(knex.fn.now()); // Added createdat with timezone
      table.timestamp('updatedat', { useTz: true }).defaultTo(knex.fn.now()); // Added updatedat with timezone
      table.string('status', 30); // Added status
      table.string('title', 255); // Added title
      table.string('teacher_id'); // Added teacher_id
      table.text('description'); // Added description

      // Indexes can be added here if necessary, e.g.:
      // table.index(['student_id']);
      // table.index(['teacher_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plan_records')
}
