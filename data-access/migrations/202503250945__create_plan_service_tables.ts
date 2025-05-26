import type { Knex } from 'knex'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '@amard/error-handling'
import * as path from 'node:path'
import ExcelJS from 'exceljs'

// اسکیم سیستم های تولید شده به همراه شماره متدشون
interface PatternsByMethod {
  [method: string]: number[][]
}

// اسکیم رکورد های جدول متد ها
interface MethodRecord {
  id: string
  number: number
  description: string
  name: string
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}

// اسکیم رکورد های جدول سیستم ها
interface SystemRecord {
  id: string
  number?: number // Auto-incremented
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

// تابع کمکی برای گرفتن مقادیر سلول های دیتاست
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

// تعریف پارامتر هایی که چند جا استفاده شدن
const target = ['postural', 'hypertrophy', 'strength', 'endurance', 'balance', 'mobility']
const level = ['novice', 'beginner', 'intermediate', 'advanced', 'expert']
const methodNames = ['descending', 'ascending', 'custom', 'sinusoidal', 'pyramidUp', 'pyramidDown', 'fullPyramidDown', 'fullPyramidUp', 'singleSet', 'constant']

// مقدار دهی اولیه خروجی درج متد های از پیش آماده شده به جدول متد ها
let methodsInserted: { number: number; name: string }[] = []

// هنگام استارت شدن سرویس، تمام جداول مورد نیاز، به همراه مقادیر مورد نیاز تولید میشن
export async function up(knex: Knex): Promise<void> {
  /**
   * ساخت جدول plan_records
   */
  const recordsTableExists = await knex.schema.hasTable('plan_records')
  if (!recordsTableExists) {
    await knex.schema.createTable('plan_records', table => {
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

      // ایندکس‌ها در صورت نیاز
      table.index(['studentId'])
      table.index(['teacherId'])
      table.index(['status'])
    })
  }

  // بررسی وجود جداول مربوط به سیستم ها
  const systemMethodsTableExists = await knex.schema.hasTable('plan_system_methods')
  const systemNumberHelperTableExists = await knex.schema.hasTable('plan_system_number_helper')
  const systemMethodNumberHelperTableExists = await knex.schema.hasTable('plan_system_method_number_helper')
  const systemsTableExists = await knex.schema.hasTable('plan_systems')

  // چون وابسته به هم هستند، اگر یکیشون وجود نداشت، همشون رو پاک میکنیم
  if (!systemMethodsTableExists || !systemNumberHelperTableExists || !systemMethodNumberHelperTableExists || !systemsTableExists) {
    try {
      await knex.schema.dropTableIfExists('plan_system_number_helper')
      await knex.schema.dropTableIfExists('plan_system_method_number_helper')
      await knex.schema.dropTableIfExists('plan_systems')
      await knex.schema.dropTableIfExists('plan_system_methods')
    } catch (error) {
      throw new AppError('PLAN_SYSTEM_DB_ERROR', `There was some issues with deleting the existing system tables`, 500, error)
    }

    try {
      /**
       * ساخت جدول کمکی مربوط به شماره سیستم حرکت ها
       */
      await knex.schema.createTable('plan_system_number_helper', table => {
        table.bigInteger('latestSystemNumber').notNullable().defaultTo(0)
      })
      // درج رکورد اولیه ضروری هست
      await knex('plan_system_number_helper').insert({ latestSystemNumber: 0 })

      /**
       * ساخت جدول کمکی مربوط به شماره متد سیستم ها
       */
      await knex.schema.createTable('plan_system_method_number_helper', table => {
        table.bigInteger('latestSystemMethodNumber').notNullable().defaultTo(0)
      })

      // درج رکورد اولیه ضروری هست
      await knex('plan_system_method_number_helper').insert({ latestSystemMethodNumber: 0 })
    } catch (error) {
      throw new AppError('PLAN_SYSTEM_HELPERS_DB_ERROR', `Error while creating system helper tables`, 500, error)
    }

    try {
      /**
       * ساخت جدول plan_system_methods
       */
      await knex.schema.createTable('plan_system_methods', table => {
        table.uuid('id').primary()
        table.integer('number').notNullable()
        table.text('description').nullable()
        table.string('name').notNullable() // از ارایه methodNames استفاده نمیکنیم چون که ممکنه مربی متد جدید بسازه
        table.enu('status', ['published', 'draft']).notNullable()
        table.timestamp('createdAt', { useTz: false }).notNullable()
        table.timestamp('updatedAt', { useTz: false }).notNullable()

        table.index(['number'])
        table.index(['id'])
      })

      // گرفتن دیتا از اکسل متد ها
      const methodsExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/methods-data.xlsx')
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(methodsExcelFilePath)
      const methodsSheet = workbook.worksheets[0]

      const nowMethodStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
      const methodRecords: MethodRecord[] = []

      // ساختن دیتای مورد نیاز برای ذخیره در دیتابیس
      methodsSheet.eachRow((row, rowNumber) => {
        // اسکیپ کردن سطر اول که نام ستون ها هست
        if (rowNumber > 1) {
          methodRecords.push({
            id: uuidv4(),
            number: Number(getCellValue(row.getCell(2), 0)),
            description: String(getCellValue(row.getCell(3), '')),
            name: String(getCellValue(row.getCell(1), '')),
            status: 'published',
            createdAt: nowMethodStr,
            updatedAt: nowMethodStr,
          })
        }
      })

      // ذخیره متد های آماده شده به صورت گله ای
      methodsInserted = await knex.batchInsert('plan_system_methods', methodRecords, 30).returning(['number', 'name'])
      console.log(`✅ Inserted ${methodsInserted.length} system methods in batch.`)

      // ذخیره آخرین شماره متد ها به جدول کمکی شماره متد ها
      if (methodsInserted.length > 0) {
        const latestNumber = Math.max(...methodsInserted.map(method => method.number))
        await knex('plan_system_method_number_helper').update({ latestSystemMethodNumber: latestNumber })
        console.log(`✅ Inserted latest system method number: ${latestNumber}`)
      }
    } catch (error) {
      // console.error(error)
      throw new AppError('PLAN_SYSTEM_METHODS_DB_ERROR', `Error while creating system methods table`, 500, error)
    }

    /**
     * ساخت جدول plan_systems
     */
    await knex.schema.createTable('plan_systems', table => {
      table.uuid('id').primary()
      table.integer('number').notNullable() // شماره سیستم
      table.integer('methodNumber').notNullable() // شماره متد سیستم تکرار در جدول متد ها
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.text('description').nullable()
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.string('teacherId', 36).notNullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      // اجازه ورود 8 تکرار برای ایجاد سیستم ها داده میشه
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

    let systems: SystemRecord[] = []
    try {
      // تولید جدول به کمک اکسل سیستم ها
      console.log('Inserting systems from the excel dataset')
      systems = await generateSystemsByExcel()
    } catch (error) {
      // اگر ایرادی در خواندن فایل اکسل بوجود آمد یا فایل موجود نیود، سیستم ها بصورت رندوم مانند تولید اولیه، ایجاد خواهند شد

      console.error(error)
      console.log('Inserting systems using the code directly')
      systems = await generateRandomSystemsInCode(methodsInserted)
    }

    // شماره آخرین سیستم وارد شده رو میزنیم توی جدول کمکی شماره سیستم ها
    if (systems.length > 0) {
      await knex('plan_system_number_helper').update({ latestSystemNumber: systems.length })
    }

    try {
      // درج گله ای سیستم های تکرار
      const systemsInserted = await knex.batchInsert('plan_systems', systems, 30).returning(['number']) // 30 = اندازه هر دسته
      console.log(`✅ Inserted ${systems.length} system records in batch.`)

      // ذخیره آخرین شماره سیستم های تکرار به جدول کمکی شماره سیستم ها
      if (systemsInserted.length > 0) {
        const latestNumber = Math.max(...systemsInserted.map(system => system.number as number))
        await knex('plan_system_number_helper').insert({ latestSystemNumber: latestNumber })
        console.log(`✅ Inserted latest system number: ${latestNumber}`)
      }
    } catch (error) {
      console.error(error)
      throw new AppError('PLAN_SYSTEMS_DB_INSERT_ERROR', 'Error while inserting pre defined systems', 500, error)
    }
  } // اگر همه جداول موجود بودند، کاری بهشون نداریم

  /**
   * ساخت جدول plan_techniques
   */
  const techniquesTableExists = await knex.schema.hasTable('plan_techniques')
  if (!techniquesTableExists) {
    await knex.schema.createTable('plan_techniques', table => {
      table.uuid('id').primary()
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.string('name', 255).notNullable() // نام تعیین شده توسط مربی
      table.string('teacherId', 36).notNullable()
      table.text('description').nullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.enu('method', ['dropset', 'giantset', 'superset', 'custom']).notNullable()
      table.enu('status', ['published', 'draft']).notNullable()
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['teacherId'])
      table.index(['isGlobal'])
    })

    const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')

    // تکنیک های معروف از پیش آماده را به جدول تکنیک ها اضافه میکنیم
    const defaultTechniques = [
      {
        id: uuidv4(),
        abbrName: 'سوپرست پایه',
        name: 'سوپرست (تمرین متوالی بدون استراحت)',
        teacherId: '-',
        description: 'انجام دو یا چند حرکت پشت سر هم بدون استراحت بین آنها. مناسب برای افزایش شدت تمرین و صرفه جویی در زمان.',
        isGlobal: true,
        descIsVisible: true,
        method: 'superset',
        status: 'published',
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        id: uuidv4(),
        abbrName: 'دراپ ست استاندارد',
        name: 'دراپ ست (کاهش تدریجی وزن)',
        teacherId: '-',
        description: 'انجام حرکت با حداکثر وزن ممکن و سپس کاهش وزن و ادامه تمرین بدون استراحت. مناسب برای ایجاد خستگی عضلانی عمیق.',
        isGlobal: true,
        descIsVisible: true,
        method: 'dropset',
        status: 'published',
        createdAt: nowStr,
        updatedAt: nowStr,
      },
      {
        id: uuidv4(),
        abbrName: 'جاینت ست ترکیبی',
        name: 'جاینت ست (ترکیب چند حرکت برای یک عضله)',
        teacherId: '-',
        description: 'ترکیب 3-4 حرکت مختلف برای یک گروه عضلانی با استراحت کم بین حرکات. مناسب برای حجم دهی شدید.',
        isGlobal: true,
        descIsVisible: true,
        method: 'giantset',
        status: 'published',
        createdAt: nowStr,
        updatedAt: nowStr,
      },
    ]

    await knex.batchInsert('plan_techniques', defaultTechniques)
  }

  /**
   * ساخت جدول plan_templates
   */
  const templateTableExists = await knex.schema.hasTable('plan_templates')
  if (!templateTableExists) {
    await knex.schema.createTable('plan_templates', table => {
      table.uuid('id').primary()
      table.string('name', 255).notNullable() // نام تعیین شده توسط مربی
      table.text('description').nullable()
      table.string('teacherId', 36).notNullable()
      table.enu('target', target).notNullable()
      table.enu('level', level).notNullable()
      table.enu('gender', ['m', 'f']).nullable()
      table.uuid('categoryId').nullable().defaultTo(null)
      table.string('muscles').nullable()
      table.jsonb('session').nullable().defaultTo('{}') // فیلد برنامه که شامل یک جلسه تمرینی هست و بصورت جیسان ذخیره میشه
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
    })
  }

  /**
   * ساخت جدول plan_train_helper
   */
  const helperTableExists = await knex.schema.hasTable('plan_train_helper')
  if (!helperTableExists) {
    await knex.schema.createTable('plan_train_helper', table => {
      table.uuid('id').primary()
      table.integer('exerciseNumber').notNullable() // اشاره به شماره حرکت در جدول حرکات
      table.integer('systemMethodNumber').notNullable() // اشاره به شماره روش در جدول روش ها
      table.integer('systemNumber').notNullable() // اشاره به شماره تکرار در جدول سیستم ها
      table.uuid('planId').notNullable() // اشاره به شماره برنامه در جدول حرکات
      table.enu('gender', ['m', 'f']).nullable()
      table.string('teacherId', 36).notNullable()
      table.enu('studentLevel', level).notNullable()
      table.enu('target', target).notNullable()
      table.integer('score').notNullable().defaultTo(0) // امتیاز یک حرکت در جدول کمکی (اگر پول برنامه پرداخت بشه، یک امتیاز اضافه میشه)
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
    })
  }

  /**
   * ساخت جدول plan_categories
   */
  let categoryId: string | undefined
  const categoryTableExists = await knex.schema.hasTable('plan_categories')
  if (!categoryTableExists) {
    await knex.schema.createTable('plan_categories', table => {
      table.uuid('id').primary()
      table.string('teacherId', 36).notNullable() //uuid => 36 char
      table.string('title', 255).notNullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      table.index(['teacherId'])
      table.index(['isGlobal'])
    })

    // یک کتگوری با عنوان "عمومی" بصورت گلوبال برای همه ایجاد میکنیم
    const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
    categoryId = uuidv4()
    await knex('plan_categories').insert({ id: categoryId, teacherId: '-', title: 'عمومی', isGlobal: true, createdAt: nowStr, updatedAt: nowStr })
  }
}

// هنگام دان شدن سرویس، تمام جداول پاک میشن
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plan_records')
  await knex.schema.dropTableIfExists('plan_exercises')
  await knex.schema.dropTableIfExists('plan_systems')
  await knex.schema.dropTableIfExists('plan_system_methods')
  await knex.schema.dropTableIfExists('plan_techniques')
  await knex.schema.dropTableIfExists('plan_train_helper')
  await knex.schema.dropTableIfExists('plan_categories')
  await knex.schema.dropTableIfExists('plan_system_method_number_helper')
  await knex.schema.dropTableIfExists('plan_system_number_helper')
}

// generatePatternByMethod تابع کمکی
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// تابع تولید سیستم های تکرار رندوم بر اساس متد وارد شده
function generatePatternByMethod(method: string) {
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

// تایع تولید سیستم های تکرار از طریق کد
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

  const systems: SystemRecord[] = Object.entries(repeatPatternsByMethod).flatMap(([methodName, repeatPatterns]) => {
    return repeatPatterns.map(repeatPattern => {
      const methodNumber = methodsInserted.find(record => record.name === methodName)?.number
      if (!methodNumber) throw new AppError('PLAN_SYSTEM_DB_ERROR', `Method number not found for ${methodName}`, 404)

      const repeats = Array(8)
        .fill(null)
        .map((_, i) => (i < repeatPattern.length ? repeatPattern[i] : null))
      const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')

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
        createdAt: nowStr,
        updatedAt: nowStr,
      }
    })
  })

  return systems
}

// تابع تولید سیستم های تکرار با کمک فایل اکسل آماده شده از قبل
async function generateSystemsByExcel(): Promise<SystemRecord[]> {
  const workbook = new ExcelJS.Workbook()
  const systemsExcelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/systems-data.xlsx')
  await workbook.xlsx.readFile(systemsExcelFilePath)
  const systemsSheet = workbook.worksheets[0]
  const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
  const systems: SystemRecord[] = []

  // Get current system number
  let currentNumber = 0

  systemsSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      systems.push({
        id: uuidv4(),
        number: ++currentNumber,
        methodNumber: getCellValue(row.getCell(3)),
        abbrName: getCellValue(row.getCell(4)),
        description: getCellValue(row.getCell(5)) !== '' ? String(getCellValue(row.getCell(5))) : null,
        descIsVisible: getCellValue(row.getCell(6)),
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
        status: getCellValue(row.getCell(17)) !== '' ? getCellValue(row.getCell(17)) : 0,
        createdAt: nowStr,
        updatedAt: nowStr,
      })
    }
  })

  return systems
}
