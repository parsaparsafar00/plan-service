import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // ساخت جدول plan_records
  let recordsTableExists = await knex.schema.hasTable('plan_records')
  if (!recordsTableExists) {
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
      table.jsonb('workoutPlan').nullable().defaultTo('{}') // فیلد برنامه که بصورت جیسان ذخیره میشه
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['studentId'])
      table.index(['teacherId'])
      table.index(['status'])
    })
  }
  // ساخت جدول plan_systems
  let systemsTableExists = await knex.schema.hasTable('plan_systems')
  if (!systemsTableExists) {
    await knex.schema.createTable('plan_systems', (table) => {
      table.uuid('id').primary()
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.text('description').nullable()
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.uuid('teacherId').notNullable()
      table.string('method', 255).notNullable() // افزایشی - ثابت - کاهشی - سینوسی  - هرم کامل رو به بالا - هرم کامل رو به پایین - هرم رو به بالا - هرم رو به پایین - دلخواه
      table.jsonb('repeatPattern').notNullable()
      table.string('status', 30).nullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['teacherId'])
    })
  }

  // ساخت جدول plan_techniques
  let techniquesTableExists = await knex.schema.hasTable('plan_techniques')
  if (!techniquesTableExists) {
    await knex.schema.createTable('plan_techniques', (table) => {
      table.uuid('id').primary()
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.string('name', 255).notNullable() // نام تعیین شده توسط مربی
      table.uuid('teacherId').notNullable()
      table.text('description').nullable()
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.string('method', 255).notNullable() // سوپرست - جاینت ست - دراپ ست - دلخواه
      table.string('status', 30).nullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['teacherId'])
    })
  }

  // ساخت جدول plan_templates
  let templateTableExists = await knex.schema.hasTable('plan_templates')
  if (!templateTableExists) {
    await knex.schema.createTable('plan_templates', (table) => {
      table.uuid('id').primary()
      table.string('name', 255).notNullable() // نام تعیین شده توسط مربی
      table.text('description').nullable()
      table.uuid('teacherId').notNullable()
      table.string('target', 255).nullable()
      table.string('level', 255).nullable()
      table.smallint('gender').nullable()
      table.jsonb('muscles').nullable().defaultTo('{}')
      table.jsonb('session').nullable().defaultTo('{}') // فیلد برنامه که شامل یک جلسه تمرینی هست و بصورت جیسان ذخیره میشه
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
    })
  }

  // ساخت جدول plan_train_helper
  let helperTableExists = await knex.schema.hasTable('plan_train_helper')
  if (!helperTableExists) {
    await knex.schema.createTable('plan_train_helper', (table) => {
      table.uuid('id').primary()
      table.integer('exerciseNumber').notNullable().references('number').inTable('plan_exercises') // اشاره به شماره حرکت در جدول حرکات
      table.uuid('planId').notNullable().references('id').inTable('plan_records') // اشاره به شماره برنامه در جدول حرکات
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plan_records')
  await knex.schema.dropTableIfExists('plan_exercises')
  await knex.schema.dropTableIfExists('plan_systems')
  await knex.schema.dropTableIfExists('plan_techniques')
  await knex.schema.dropTableIfExists('plan_train_helper')
}
