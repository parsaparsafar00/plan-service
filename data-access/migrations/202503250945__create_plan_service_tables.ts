import type { Knex } from 'knex'
export async function up(knex: Knex): Promise<void> {
  // ساخت جدول planRecords
  let tableExists = await knex.schema.hasTable('plan_records')
  if (!tableExists) {
    await knex.schema.createTable('plan_records', (table) => {
      table.uuid('id').primary()
      table.uuid('studentId').notNullable()
      table.integer('studentAge').notNullable()
      table.integer('studentWeight').nullable()
      table.string('studentLevel', 255).notNullable()
      table.uuid('teacherId').nullable()
      table.string('title', 255).nullable()
      table.string('target', 255).notNullable()
      table.string('status', 30).nullable()
      table.text('description').nullable()
      table.integer('nWeeks').nullable() // تعداد هفته های برنامه 
      table.text('workoutPlan').nullable() // فیلد برنامه که بصورت جیسان ذخیره میشه

      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['studentId'])
      table.index(['teacherId'])
      table.index(['status'])
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plan_exercises')
  await knex.schema.dropTableIfExists('plan_records')
}
