import type { Knex } from 'knex'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '@amard/error-handling'
import * as path from 'node:path'
import ExcelJS from 'exceljs'

// اسکیم سیستم‌های تولید شده به همراه شماره متدشون
interface PatternsByMethod {
  [method: string]: number[][]
}

// اسکیم رکوردهای جدول متدها
interface MethodRecord {
  id: string
  number: number
  description: string
  name: string
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}

// اسکیم رکوردهای جدول سیستم‌ها
interface SystemRecord {
  id: string
  number?: number
  methodNumber: number
  abbrName: string
  description: string | null
  descIsVisible: boolean
  teacherId: string
  isGlobal: boolean
  repeat1: number | null
  repeat2: number | null
  repeat3: number | null
  repeat4: number | null
  repeat5: number | null
  repeat6: number | null
  repeat7: number | null
  repeat8: number | null
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}

// تعریف پارامترهایی که چند جا استفاده شدن
const target = ['postural', 'hypertrophy', 'strength', 'endurance', 'balance', 'mobility']
const level = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
const methodNames = ['descending', 'ascending', 'custom', 'sinusoidal', 'pyramidUp', 'pyramidDown', 'fullPyramidDown', 'fullPyramidUp', 'singleSet', 'constant']

// مقداردهی اولیه خروجی درج متدهای از پیش آماده شده به جدول متدها
let methodsInserted: { number: number; name: string }[] = []

// تابع کمکی برای گرفتن مقادیر سلول‌های دیتاست
const getCellValue = (cell: ExcelJS.Cell, defaultValue: any = ''): any => {
  if (!cell || cell.value === undefined || cell.value === null) {
    return defaultValue
  }

  // Handle different cell value types
  switch (typeof cell.value) {
    case 'string':
    case 'number':
      return cell.value
    case 'object':
      if (cell.value instanceof Date) {
        return cell.value.toString()
      }
      return defaultValue
    default:
      return defaultValue
  }
}

/**
 * بررسی وجود جدول و ایجاد آن در صورت عدم وجود
 * @param knex نمونه Knex برای ارتباط با دیتابیس
 * @param tableName نام جدول
 * @param createFn تابع ساخت جدول
 */
async function createTableIfNotExists(knex: Knex, tableName: string, createFn: (table: Knex.CreateTableBuilder) => void): Promise<void> {
  const exists = await knex.schema.hasTable(tableName)
  if (!exists) {
    await knex.schema.createTable(tableName, createFn)
  }
}

/**
 * حذف جداول در صورت وجود
 * @param knex نمونه Knex برای ارتباط با دیتابیس
 * @param tableNames لیست نام جداول برای حذف
 */
async function dropTablesIfExist(knex: Knex, tableNames: string[]): Promise<void> {
  try {
    for (const tableName of tableNames) {
      await knex.schema.dropTableIfExists(tableName)
    }
  } catch (error) {
    throw new AppError('TABLE_DROP_ERROR', `خطا در حذف جداول: ${tableNames.join(', ')}`, 500, error)
  }
}

/**
 * ساخت جدول plan_records
 */
async function createPlanRecordsTable(knex: Knex): Promise<void> {
  await createTableIfNotExists(knex, 'plan_records', table => {
    table.uuid('id').primary()
    table.uuid('studentId').notNullable()
    table.integer('studentAge').notNullable()
    table.integer('studentWeight').nullable()
    table.enu('studentLevel', level).notNullable()
    table.string('teacherId', 36).notNullable()
    table.string('title', 255).nullable()
    table.enu('studentGender', ['m', 'f']).nullable()
    table.enu('target', target).notNullable()
    table.enu('status', ['paid', 'published', 'draft', 'deleted']).notNullable()
    table.text('description').nullable()
    table.jsonb('workoutPlan').nullable().defaultTo('{}') // فیلد برنامه که بصورت جیسان ذخیره میشه
    table.timestamp('createdAt', { useTz: false }).notNullable()
    table.timestamp('updatedAt', { useTz: false }).notNullable()
    table.index(['studentId'])
    table.index(['teacherId'])
    table.index(['status'])
  })
}

/**
 * ساخت جداول مربوط به سیستم‌ها و درج داده‌های اولیه
 */
async function createSystemTables(knex: Knex): Promise<void> {
  // اگر همه جداول مربوط به سیستم ها موجود نبودند، باید همشون پاک بشن و دوباره ساخته بشن
  const systemTables = ['plan_system_methods', 'plan_systems', 'plan_system_number_helper', 'plan_system_method_number_helper']
  const allExist = await Promise.all(systemTables.map(table => knex.schema.hasTable(table)))
  if (!allExist.every(Boolean)) {
    await dropTablesIfExist(knex, systemTables.reverse())

    // ساخت جدول کمکی مربوط به شماره سیستم حرکت‌ها
    await createTableIfNotExists(knex, 'plan_system_number_helper', table => {
      table.bigInteger('latestSystemNumber').notNullable().defaultTo(0)
    })
    await knex('plan_system_number_helper').insert({ latestSystemNumber: 0 })

    // ساخت جدول کمکی مربوط به شماره متد سیستم‌ها
    await createTableIfNotExists(knex, 'plan_system_method_number_helper', table => {
      table.bigInteger('latestSystemMethodNumber').notNullable().defaultTo(0)
    })
    await knex('plan_system_method_number_helper').insert({ latestSystemMethodNumber: 0 })

    // ساخت جدول plan_system_methods
    await createTableIfNotExists(knex, 'plan_system_methods', table => {
      table.uuid('id').primary()
      table.integer('number').notNullable()
      table.text('description').nullable()
      table.string('name').notNullable()
      table.enu('status', ['published', 'draft']).notNullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
      table.index(['number'])
      table.index(['id'])
    })
    await insertMethodsFromExcel(knex) // متد ها لزوما از اکسل خوانده میشوند

    // ساخت جدول plan_systems
    await createTableIfNotExists(knex, 'plan_systems', table => {
      table.uuid('id').primary()
      table.integer('number').notNullable()
      table.integer('methodNumber').notNullable()
      table.string('abbrName').notNullable()
      table.text('description').nullable()
      table.boolean('descIsVisible').nullable()
      table.string('teacherId', 36).notNullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.integer('repeat1')
      table.integer('repeat2')
      table.integer('repeat3')
      table.integer('repeat4')
      table.integer('repeat5')
      table.integer('repeat6')
      table.integer('repeat7')
      table.integer('repeat8')
      table.enu('status', ['published', 'draft']).notNullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
      table.index(['teacherId'])
      table.index(['number'])
      table.index(['isGlobal'])
    })
    await insertSystems(knex) // سیستم های تکرار یا از اکسل خوانده میشوند یا توسط کد تولید میشوند
  }
}

/**
 * ساخت جداول مربوط به تکنیک‌ها و درج داده‌های اولیه
 */
async function createTechniqueTables(knex: Knex): Promise<void> {
  // اگر همه جداول مربوط به تکنیک‌ها موجود نبودند، باید همشون پاک بشن و دوباره ساخته بشن
  const techniqueTables = ['plan_techniques', 'plan_technique_methods', 'plan_technique_number_helper', 'plan_technique_method_number_helper']
  const allExist = await Promise.all(techniqueTables.map(table => knex.schema.hasTable(table)))
  if (!allExist.every(Boolean)) {
    await dropTablesIfExist(knex, techniqueTables.reverse())

    // ساخت جدول کمکی مربوط به شماره تکنیک‌ها
    await createTableIfNotExists(knex, 'plan_technique_number_helper', table => {
      table.bigInteger('latestTechniqueNumber').notNullable().defaultTo(0)
    })
    await knex('plan_technique_number_helper').insert({ latestTechniqueNumber: 0 })

    // ساخت جدول کمکی مربوط به شماره متد تکنیک‌ها
    await createTableIfNotExists(knex, 'plan_technique_method_number_helper', table => {
      table.bigInteger('latestTechniqueMethodNumber').notNullable().defaultTo(0)
    })
    await knex('plan_technique_method_number_helper').insert({ latestTechniqueMethodNumber: 0 })

    // ساخت جدول plan_technique_methods
    await createTableIfNotExists(knex, 'plan_technique_methods', table => {
      table.uuid('id').primary()
      table.integer('number').primary()
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.enu('status', ['published', 'draft']).notNullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
      table.index(['number'])
    })
    await insertTechniqueMethodsFromExcel(knex)

    // ساخت جدول plan_techniques
    await createTableIfNotExists(knex, 'plan_techniques', table => {
      table.uuid('id').primary()
      table.integer('number').primary()
      table.integer('methodNumber').primary()
      table.string('abbrName').notNullable()
      table.string('name', 255).notNullable()
      table.string('teacherId', 36).notNullable()
      table.text('description').nullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.boolean('descIsVisible').nullable()
      table.enu('status', ['published', 'draft']).notNullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
      table.index(['number'])
      table.index(['teacherId'])
      table.index(['isGlobal'])
    })
    await insertTechniquesFromExcel(knex)
  }
}

/**
 * ساخت جدول plan_templates
 */
async function createPlanTemplatesTable(knex: Knex): Promise<void> {
  await createTableIfNotExists(knex, 'plan_templates', table => {
    table.uuid('id').primary()
    table.string('name', 255).notNullable()
    table.text('description').nullable()
    table.string('teacherId', 36).notNullable()
    table.enu('target', target).notNullable()
    table.enu('level', level).notNullable()
    table.enu('gender', ['m', 'f']).nullable()
    table.uuid('categoryId').nullable().defaultTo(null)
    table.string('muscles').nullable()
    table.jsonb('session').nullable().defaultTo('{}')
    table.timestamp('createdAt', { useTz: false }).notNullable()
    table.timestamp('updatedAt', { useTz: false }).notNullable()
  })
}

/**
 * ساخت جدول plan_train_helper
 */
async function createPlanTrainHelperTable(knex: Knex): Promise<void> {
  await createTableIfNotExists(knex, 'plan_train_helper', table => {
    table.uuid('id').primary()
    table.integer('exerciseNumber').notNullable()
    table.integer('systemMethodNumber').notNullable()
    table.integer('systemNumber').notNullable()
    table.integer('techniqueMethodNumber').nullable()
    table.integer('techniqueNumber').nullable()
    table.uuid('planId').notNullable()
    table.enu('gender', ['m', 'f']).nullable()
    table.string('teacherId', 36).notNullable()
    table.enu('studentLevel', level).notNullable()
    table.enu('target', target).notNullable()
    table.integer('score').notNullable().defaultTo(0)
    table.timestamp('createdAt', { useTz: false }).notNullable()
    table.timestamp('updatedAt', { useTz: false }).notNullable()
  })
}

/**
 * ساخت جدول plan_categories و درج کتگوری پیش‌فرض
 */
async function createPlanCategoriesTable(knex: Knex): Promise<void> {
  await createTableIfNotExists(knex, 'plan_categories', table => {
    table.uuid('id').primary()
    table.string('teacherId', 36).notNullable()
    table.string('title', 255).notNullable()
    table.boolean('isGlobal').notNullable().defaultTo(false)
    table.timestamp('createdAt', { useTz: false }).notNullable()
    table.timestamp('updatedAt', { useTz: false }).notNullable()
    table.index(['teacherId'])
    table.index(['isGlobal'])
  })

  // یک کتگوری با عنوان "عمومی" بصورت گلوبال برای همه ایجاد میکنیم
  const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
  await knex('plan_categories').insert({
    id: uuidv4(),
    teacherId: '-',
    title: 'عمومی',
    isGlobal: true,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp,
  })
}

/**
 * درج متدهای از پیش آماده شده از فایل اکسل
 */
async function insertMethodsFromExcel(knex: Knex): Promise<void> {
  try {
    const methodsExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/system-methods-data.xlsx')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(methodsExcelFilePath)
    const methodsSheet = workbook.worksheets[0]
    const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
    const methodRecords: MethodRecord[] = []

    // ساختن دیتای مورد نیاز برای ذخیره در دیتابیس
    methodsSheet.eachRow((row, rowNumber) => {
      // اسکیپ کردن سطر اول که نام ستون‌ها هست
      if (rowNumber > 1) {
        methodRecords.push({
          id: uuidv4(),
          number: Number(getCellValue(row.getCell(2), 0)),
          description: String(getCellValue(row.getCell(3), '')),
          name: String(getCellValue(row.getCell(1), '')),
          status: 'published',
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
      }
    })

    // ذخیره متدهای آماده شده به صورت گله‌ای
    methodsInserted = await knex.batchInsert('plan_system_methods', methodRecords, 30).returning(['number', 'name'])
    console.log(`✅ درج ${methodsInserted.length} متد سیستمی به صورت گله‌ای`)

    // ذخیره آخرین شماره متدها به جدول کمکی شماره متدها
    if (methodsInserted.length > 0) {
      const latestNumber = Math.max(...methodsInserted.map(method => method.number))
      await knex('plan_system_method_number_helper').update({ latestSystemMethodNumber: latestNumber })
      console.log(`✅ درج آخرین شماره متد سیستمی: ${latestNumber}`)
    }
  } catch (error) {
    throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', `خطا در درج متدها از فایل اکسل`, 500, error)
  }
}

/**
 * درج متدهای تکنیک از فایل اکسل
 */
async function insertTechniqueMethodsFromExcel(knex: Knex): Promise<void> {
  try {
    const techniquesExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/technique-methods-data.xlsx')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(techniquesExcelFilePath)
    const techniquesSheet = workbook.worksheets[0]
    const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
    const techniqueRecords: MethodRecord[] = []

    // ساختن دیتای مورد نیاز برای ذخیره در دیتابیس
    techniquesSheet.eachRow((row, rowNumber) => {
      // اسکیپ کردن سطر اول که نام ستون‌ها هست
      if (rowNumber > 1) {
        techniqueRecords.push({
          id: uuidv4(),
          name: String(getCellValue(row.getCell(1), '')),
          number: Number(getCellValue(row.getCell(2), 0)),
          description: String(getCellValue(row.getCell(3), '')),
          status: 'published',
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
      }
    })

    // ذخیره متدهای تکنیکی آماده شده به صورت گله‌ای
    const techniquesInserted = await knex.batchInsert('plan_technique_methods', techniqueRecords, 10).returning(['number', 'name'])
    console.log(`✅ درج ${techniquesInserted.length} متد تکنیکی به صورت گله‌ای`)

    // ذخیره آخرین شماره متدهای تکنیکی به جدول کمکی شماره متدهای تکنیکی
    if (techniquesInserted.length > 0) {
      const latestNumber = Math.max(...techniquesInserted.map(technique => technique.number))
      await knex('plan_technique_method_number_helper').update({ latestTechniqueMethodNumber: latestNumber })
      console.log(`✅ درج آخرین شماره متد تکنیکی: ${latestNumber}`)
    }
  } catch (error) {
    throw new AppError('PLAN_TECHNIQUE_METHODS_DB_ERROR', `خطا در درج متدهای تکنیکی از فایل اکسل`, 500, error)
  }
}

/**
 * درج سیستم‌های تکرار، از اکسل یا تولید تصادفی
 */
async function insertSystems(knex: Knex): Promise<void> {
  let systems: SystemRecord[] = []
  try {
    console.log('درج سیستم‌ها از دیتاست اکسل')
    systems = await generateSystemsByExcel()
  } catch (error) {
    console.error(error)
    console.log('درج سیستم‌ها با استفاده مستقیم از کد')
    systems = await generateRandomSystemsInCode(methodsInserted)
  }

  if (systems.length > 0) {
    const systemsInserted = await knex.batchInsert('plan_systems', systems, 30).returning(['number'])
    console.log(`✅ درج ${systems.length} رکورد سیستمی به صورت گله‌ای`)

    const latestNumber = Math.max(...systemsInserted.map(system => system.number as number))
    await knex('plan_system_number_helper').update({ latestSystemNumber: latestNumber })
    console.log(`✅ درج آخرین شماره سیستم: ${latestNumber}`)
  }
}

/**
 * درج تکنیک‌های از پیش تعیین شده از فایل اکسل
 */
async function insertTechniquesFromExcel(knex: Knex): Promise<void> {
  try {
    const techniquesExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/techniques-data.xlsx')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(techniquesExcelFilePath)
    const techniquesSheet = workbook.worksheets[0]
    const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
    const techniqueRecords: any[] = []

    // ساختن دیتای مورد نیاز برای ذخیره در دیتابیس
    techniquesSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // اسکیپ کردن سطر اول که نام ستون‌ها هست
        techniqueRecords.push({
          id: uuidv4(),
          number: Number(getCellValue(row.getCell(1), 0)),
          methodNumber: Number(getCellValue(row.getCell(2), 0)),
          description: String(getCellValue(row.getCell(3), '')) || null,
          name: String(getCellValue(row.getCell(4), '')),
          abbrName: String(getCellValue(row.getCell(5), '')),
          teacherId: '-',
          isGlobal: true,
          descIsVisible: true,
          status: 'published',
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
      }
    })

    // ذخیره تکنیک‌های آماده شده به صورت گله‌ای
    const techniquesInserted = await knex.batchInsert('plan_techniques', techniqueRecords, 10).returning(['number'])
    console.log(`✅ درج ${techniquesInserted.length} تکنیک به صورت گله‌ای`)

    // ذخیره آخرین شماره تکنیک به جدول کمکی شماره تکنیک‌ها
    if (techniquesInserted.length > 0) {
      const latestNumber = Math.max(...techniquesInserted.map(technique => technique.number))
      await knex('plan_technique_number_helper').update({ latestTechniqueNumber: latestNumber })
      console.log(`✅ درج آخرین شماره تکنیک: ${latestNumber}`)
    }
  } catch (error) {
    console.error(error)
    throw new AppError('PLAN_TECHNIQUE_DB_ERROR', `خطا در درج تکنیک‌ها از فایل اکسل`, 500, error)
  }
}

/**
 * تولید عدد تصادفی بین حداقل و حداکثر
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * تولید الگوی تکرار بر اساس متد مشخص شده
 */
function generatePatternByMethod(method: string): number[] {
  const pattern = []
  const len = getRandomInt(3, 6)

  switch (method) {
    case 'constant':
      return Array(len).fill(getRandomInt(5, 15))

    case 'ascending': {
      const start = getRandomInt(1, 10)
      const step = getRandomInt(1, 5)
      for (let i = 0; i < len; i++) {
        pattern.push(start + i * step)
      }
      return pattern
    }

    case 'descending': {
      const start = getRandomInt(15, 30)
      const step = getRandomInt(1, 5)
      for (let i = 0; i < len; i++) {
        pattern.push(Math.abs(start - i * step))
      }
      return pattern
    }

    case 'pyramidUp': {
      const peak = getRandomInt(10, 20)
      const half = Math.floor(len / 2)
      const left = []
      let right = []
      for (let i = 0; i <= half; i++) {
        left.push(peak - (half - i) * getRandomInt(1, 3))
      }
      right = left.slice(0, -1).reverse()
      if (len % 2 === 0) left.pop()
      return [...left, ...right]
    }

    case 'pyramidDown': {
      const valley = getRandomInt(5, 10)
      const half = Math.floor(len / 2)
      const left = []
      let right = []
      for (let i = 0; i <= half; i++) {
        left.push(valley + (half - i) * getRandomInt(1, 3))
      }
      right = left.slice(0, -1).reverse()
      if (len % 2 === 0) left.pop()
      return [...left, ...right]
    }

    case 'fullPyramidUp': {
      const start = getRandomInt(5, 10)
      const step = getRandomInt(1, 3)
      const halfLen = Math.floor((len + 1) / 2)
      const half = Array.from({ length: halfLen }, (_, i) => start + i * step)
      const mirror = half.slice(0, len % 2 === 0 ? halfLen : halfLen - 1).reverse()
      return [...half, ...mirror]
    }

    case 'fullPyramidDown': {
      const start = getRandomInt(10, 20)
      const step = getRandomInt(1, 3)
      const halfLen = Math.floor((len + 1) / 2)
      const half = Array.from({ length: halfLen }, (_, i) => start - i * step)
      const mirror = half.slice(0, len % 2 === 0 ? halfLen : halfLen - 1).reverse()
      return [...half, ...mirror]
    }

    case 'sinusoidal': {
      let val = getRandomInt(5, 15)
      pattern.push(val)
      for (let i = 1; i < len; i++) {
        const delta = getRandomInt(1, 4)
        val = i % 2 === 0 ? val + delta : val - delta
        pattern.push(val)
      }
      return pattern
    }

    default:
      return []
  }
}

/**
 * تابع تولید سیستم‌های تکرار رندوم بر اساس متد وارد شده
 */
async function generateRandomSystemsInCode(methodsInserted: Array<{ number: number; name: string }>): Promise<SystemRecord[]> {
  let currentNumber = 1
  const repeatPatternsByMethod: PatternsByMethod = {}

  for (const method of methodNames) {
    if (method === 'custom' || method === 'singleSet') continue

    const set = new Set<string>()
    repeatPatternsByMethod[method] = []

    while (repeatPatternsByMethod[method].length < 30) {
      const repeatPattern = generatePatternByMethod(method)
      const key = repeatPattern.join(',')
      if (!set.has(key)) {
        set.add(key)
        repeatPatternsByMethod[method].push(repeatPattern)
      }
    }
  }

  const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
  const systems: SystemRecord[] = Object.entries(repeatPatternsByMethod).flatMap(([methodName, repeatPatterns]) => {
    return repeatPatterns.map(repeatPattern => {
      const methodNumber = methodsInserted.find(record => record.name === methodName)?.number
      if (!methodNumber) throw new AppError('PLAN_SYSTEM_DB_ERROR', `شماره متد برای ${methodName} یافت نشد`, 404)

      const repeats = Array(8)
        .fill(null)
        .map((_, i) => (i < repeatPattern.length ? repeatPattern[i] : null))

      return {
        id: uuidv4(),
        number: ++currentNumber,
        methodNumber,
        abbrName: `سیستم ${methodName} ${repeatPattern.toString()}`,
        description: '',
        descIsVisible: false,
        teacherId: '-',
        isGlobal: true,
        status: 'published',
        repeat1: repeats[0],
        repeat2: repeats[1],
        repeat3: repeats[2],
        repeat4: repeats[3],
        repeat5: repeats[4],
        repeat6: repeats[5],
        repeat7: repeats[6],
        repeat8: repeats[7],
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      }
    })
  })

  return systems
}

/**
 * تابع تولید سیستم‌های تکرار با کمک فایل اکسل آماده شده از قبل
 */
async function generateSystemsByExcel(): Promise<SystemRecord[]> {
  const workbook = new ExcelJS.Workbook()
  const systemsExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/systems-data.xlsx')
  await workbook.xlsx.readFile(systemsExcelFilePath)
  const systemsSheet = workbook.worksheets[0]
  const currentTimestamp = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
  const systems: SystemRecord[] = []
  let currentNumber = 0

  systemsSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      systems.push({
        id: uuidv4(),
        number: ++currentNumber,
        methodNumber: getCellValue(row.getCell(3)),
        abbrName: getCellValue(row.getCell(4)),
        description: getCellValue(row.getCell(5)) !== '' ? String(getCellValue(row.getCell(5))) : null,
        descIsVisible: Boolean(getCellValue(row.getCell(6))),
        teacherId: getCellValue(row.getCell(7)),
        isGlobal: getCellValue(row.getCell(8)),
        repeat1: getCellValue(row.getCell(9)) !== '' ? getCellValue(row.getCell(9)) : 0,
        repeat2: getCellValue(row.getCell(10)) !== '' ? getCellValue(row.getCell(10)) : 0,
        repeat3: getCellValue(row.getCell(11)) !== '' ? getCellValue(row.getCell(11)) : 0,
        repeat4: getCellValue(row.getCell(12)) !== '' ? getCellValue(row.getCell(12)) : 0,
        repeat5: getCellValue(row.getCell(13)) !== '' ? getCellValue(row.getCell(13)) : 0,
        repeat6: getCellValue(row.getCell(14)) !== '' ? getCellValue(row.getCell(14)) : 0,
        repeat7: getCellValue(row.getCell(15)) !== '' ? getCellValue(row.getCell(15)) : 0,
        repeat8: getCellValue(row.getCell(16)) !== '' ? getCellValue(row.getCell(16)) : 0,
        status: getCellValue(row.getCell(17)) !== '' ? getCellValue(row.getCell(17)) : 'draft',
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      })
    }
  })

  return systems
}

/**
 * هنگام استارت شدن سرویس، تمام جداول مورد نیاز، به همراه مقادیر مورد نیاز تولید می‌شوند
 */
export async function up(knex: Knex): Promise<void> {
  await createPlanRecordsTable(knex)
  await createSystemTables(knex)
  await createTechniqueTables(knex)
  await createPlanTemplatesTable(knex)
  await createPlanTrainHelperTable(knex)
  await createPlanCategoriesTable(knex)
}

/**
 * هنگام دان شدن سرویس، تمام جداول پاک می‌شوند
 */
export async function down(knex: Knex): Promise<void> {
  await dropTablesIfExist(knex, ['plan_records', 'plan_exercises', 'plan_systems', 'plan_system_methods', 'plan_techniques', 'plan_technique_methods', 'plan_train_helper', 'plan_categories', 'plan_system_method_number_helper', 'plan_system_number_helper', 'plan_technique_method_number_helper', 'plan_technique_number_helper'])
}
