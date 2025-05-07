import type { Knex } from 'knex'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '@amard/error-handling'

export async function up(knex: Knex): Promise<void> {
  // ساخت جدول plan_records
  const recordsTableExists = await knex.schema.hasTable('plan_records')
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
  const systemsTableExists = await knex.schema.hasTable('plan_systems')
  if (!systemsTableExists) {
    await knex.schema.createTable('plan_systems', (table) => {
      table.uuid('id').primary()
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.text('description').nullable()
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.uuid('teacherId').nullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.string('method', 255).notNullable() // افزایشی - ثابت - کاهشی - سینوسی  - هرم کامل رو به بالا - هرم کامل رو به پایین - هرم رو به بالا - هرم رو به پایین - دلخواه
      table.jsonb('repeatPattern').notNullable()
      table.string('status', 30).nullable()
      table.integer('usageTimes').defaultTo(0)
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['teacherId'])
      table.index(['isGlobal'])
    })

    // تولید سیستم های آماده
    const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-MM-dd HH:mm:ss')
    try {
      const patterns = generateThreeLengthRepeatPatterns()
      for (const pattern of patterns) {
        const method = detectSystemMethod(pattern)

        const system = {
          id: uuidv4(),
          abbrName: `سیستم ${method} ${pattern.toString()}`,
          description: 'سیستم تولید شده توسط هوش مصنوعی',
          descIsVisible: false,
          teacherId: null,
          isGlobal: true,
          method: method,
          repeatPattern: JSON.stringify(pattern),
          status: 'active',
          createdAt: nowStr,
          updatedAt: nowStr,
        }

        await knex('plan_systems').insert(system)
      }
      console.log(`✅ Inserted ${patterns.length} system records.`)
    } catch (error) {
        throw new AppError('PLAN_SYSTEM_DB_INSERT_ERROR', 'خطا در تولید سیستم های از پیش تعریف شده ', 500, error)
    }
  }

  // ساخت جدول plan_techniques
  const techniquesTableExists = await knex.schema.hasTable('plan_techniques')
  if (!techniquesTableExists) {
    await knex.schema.createTable('plan_techniques', (table) => {
      table.uuid('id').primary()
      table.string('abbrName').notNullable() // نام اختصاری تولید شده (توسط خودمان) بر اساس پارامتر های تعیین شده توسط مربی
      table.string('name', 255).notNullable() // نام تعیین شده توسط مربی
      table.uuid('teacherId').nullable()
      table.text('description').nullable()
      table.boolean('isGlobal').notNullable().defaultTo(false)
      table.boolean('descIsVisible').nullable() // آیا نیاز است که توضیحات به دانش آموز نمایش داده شود یا خیر
      table.string('method', 255).notNullable() // سوپرست - جاینت ست - دراپ ست - دلخواه
      table.string('status', 30).nullable()
      table.integer('usageTimes').defaultTo(0)
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()

      // ایندکس‌ها در صورت نیاز
      table.index(['teacherId'])
      table.index(['isGlobal'])
    })

    const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss');
  
    // تکنیک های معروف از پیش آماده را به جدول تکنیک ها اضافه میکنیم
    const defaultTechniques = [
      {
        id: uuidv4(),
        abbrName: 'سوپرست پایه',
        name: 'سوپرست (تمرین متوالی بدون استراحت)',
        teacherId: null,
        description: 'انجام دو یا چند حرکت پشت سر هم بدون استراحت بین آنها. مناسب برای افزایش شدت تمرین و صرفه جویی در زمان.',
        isGlobal: true,
        descIsVisible: true,
        method: 'superset',
        status: 'active',
        usageTimes: 0,
        createdAt: nowStr,
        updatedAt: nowStr
      },
      {
        id: uuidv4(),
        abbrName: 'دراپ ست استاندارد',
        name: 'دراپ ست (کاهش تدریجی وزن)',
        teacherId: null,
        description: 'انجام حرکت با حداکثر وزن ممکن و سپس کاهش وزن و ادامه تمرین بدون استراحت. مناسب برای ایجاد خستگی عضلانی عمیق.',
        isGlobal: true,
        descIsVisible: true,
        method: 'dropset',
        status: 'active',
        usageTimes: 0,
        createdAt: nowStr,
        updatedAt: nowStr
      },
      {
        id: uuidv4(),
        abbrName: 'جاینت ست ترکیبی',
        name: 'جاینت ست (ترکیب چند حرکت برای یک عضله)',
        teacherId: null,
        description: 'ترکیب 3-4 حرکت مختلف برای یک گروه عضلانی با استراحت کم بین حرکات. مناسب برای حجم دهی شدید.',
        isGlobal: true,
        descIsVisible: true,
        method: 'giantset',
        status: 'active',
        usageTimes: 0,
        createdAt: nowStr,
        updatedAt: nowStr
      }
    ];
    
    await knex.batchInsert('plan_techniques', defaultTechniques);
  }

  // ساخت جدول plan_templates
  const templateTableExists = await knex.schema.hasTable('plan_templates')
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
  const helperTableExists = await knex.schema.hasTable('plan_train_helper')
  if (!helperTableExists) {
    await knex.schema.createTable('plan_train_helper', (table) => {
      table.uuid('id').primary()
      table.integer('exerciseNumber').notNullable()// اشاره به شماره حرکت در جدول حرکات
      table.uuid('planId').notNullable() // اشاره به شماره برنامه در جدول حرکات
      table.timestamp('createdAt', { useTz: false }).notNullable()
      table.timestamp('updatedAt', { useTz: false }).notNullable()
    })
  }

  // ساخت جدول plan_categories
  let categoryId: string | undefined
  const categoryTableExists = await knex.schema.hasTable('plan_categories')
  if (!categoryTableExists) {
    await knex.schema.createTable('plan_categories', (table) => {
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
    const nowStr = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')
    categoryId = uuidv4()
    await knex('plan_categories').insert({ id: categoryId, teacherId: '-', title: 'عمومی', isGlobal: true, createdAt: nowStr, updatedAt: nowStr })
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plan_records')
  await knex.schema.dropTableIfExists('plan_exercises')
  await knex.schema.dropTableIfExists('plan_systems')
  await knex.schema.dropTableIfExists('plan_techniques')
  await knex.schema.dropTableIfExists('plan_train_helper')
  await knex.schema.dropTableIfExists('plan_categories')
}

// وقتی داریم سیستم تولید میکنیم، باید متوجه بشیم که متد سیستم تولید شده چیه
function detectSystemMethod(pattern: number[]):  "descending" | "ascending" | "custom" | "sinusoidal" | "pyramidUp" | "pyramidDown" | "singleSet" {
  if (pattern.length < 2) return 'singleSet'

  const isSymmetric = pattern.join() === [...pattern].reverse().join()
  const isSameStartEnd = pattern[0] === pattern[pattern.length - 1]

  if (isSameStartEnd && isSymmetric && pattern.length >= 3 && pattern[1] > pattern[0]) {
    return 'sinusoidal'
  }

  let peakIndex = pattern.indexOf(Math.max(...pattern))
  if (
    peakIndex > 0 &&
    peakIndex < pattern.length - 1 &&
    isStrictlyIncreasing(pattern.slice(0, peakIndex + 1)) &&
    isStrictlyDecreasing(pattern.slice(peakIndex)) &&
    !isSameStartEnd
  ) {
    return 'pyramidUp'
  }

  let valleyIndex = pattern.indexOf(Math.min(...pattern))
  if (
    valleyIndex > 0 && valleyIndex < pattern.length - 1 && isStrictlyDecreasing(pattern.slice(0, valleyIndex + 1)) && isStrictlyIncreasing(pattern.slice(valleyIndex)) && !isSameStartEnd
  ) {
    return 'pyramidDown'
  }

  const isAscending = pattern.every((v, i, a) => i === 0 || v >= a[i - 1]) && pattern.some((v, i, a) => i !== 0 && v > a[i - 1])
  const isDescending = pattern.every((v, i, a) => i === 0 || v <= a[i - 1]) && pattern.some((v, i, a) => i !== 0 && v < a[i - 1])

  if (isAscending) return 'ascending'
  if (isDescending) return 'descending'

  return 'custom'
}

function isStrictlyIncreasing(arr: number[]) {
  return arr.every((v, i) => i === 0 || v > arr[i - 1])
}

function isStrictlyDecreasing(arr: number[]) {
  return arr.every((v, i) => i === 0 || v < arr[i - 1])
}

// تابع تولید تمام الگوهای تکرار با طول دقیقا ۳
function generateThreeLengthRepeatPatterns(): number[][] {
  const results: number[][] = []; // آرایه‌ای برای ذخیره نتایج نهایی

  // تابع بازگشتی برای تولید ترکیبات
  const recurse = (current: number[]) => {
    if (current.length === 3) { // اگر طول آرایه به ۳ رسید
      results.push([...current]); // آرایه فعلی را به نتایج اضافه کن
      return; // از این شاخه بازگشت کن
    }

    // حلقه برای تولید اعداد از ۵ تا ۱۵
    for (let i = 6; i <= 12; i++) { // حداقل ۵ و حداکثر ۱۵ تکرار در هر ست
      current.push(i); 
      recurse(current); // بازگشت با آرایه جدید
      current.pop(); 
    }
  }

  recurse([]);
  return results; 
}