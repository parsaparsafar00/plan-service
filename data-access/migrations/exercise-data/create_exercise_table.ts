import type { Knex } from 'knex'
import * as path from 'node:path'
import ExcelJS from 'exceljs'
import { v4 as uuidv4 } from 'uuid'

// کمل کیس بدون استفاده از کتابخانه های نود جی اس
function customCamelCase(str: string): string {
  return str
    .replace(/[\-*#]/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')
}

export async function initExerciseTable(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('plan_exercises')
  if (!tableExists) {
    await knex.schema.createTable('plan_exercises', (table) => {
      table.integer('number').unique()
      table.uuid('id')
      table.primary(['number', 'id']) // composite primary key
      table.string('name', 255).notNullable()
      table.string('nameFa', 255).notNullable()
      table.text('shortYoutubeDemonstration').nullable()
      table.text('inDepthYoutubeExplanation').nullable()
      table.string('difficultyLevel', 50).nullable()
      table.string('targetMuscleGroup', 255).nullable()
      table.string('primeMoverMuscle', 255).nullable()
      table.string('secondaryMuscle', 255).nullable()
      table.string('tertiaryMuscle', 255).nullable()
      table.string('primaryEquipment', 255).nullable()
      table.string('secondaryEquipment', 255).nullable()
      table.integer('numberOfItems').nullable()
      table.string('posture', 255).nullable()
      table.string('singleOrDoubleArm', 255).nullable()
      table.string('grip', 255).nullable()
      table.string('loadPositionAtTheEnd', 255).nullable()
      table.string('footElevation', 255).nullable()
      table.string('comboExercises', 255).nullable()
      table.string('movementPattern', 255).nullable()
      table.string('movementPattern2', 255).nullable()
      table.string('movementPattern3', 255).nullable()
      table.string('bodyRegion', 255).nullable()
      table.string('forceType', 255).nullable()
      table.string('laterality', 255).nullable()
      table.string('exerciseClassification', 255).nullable()
      table.string('muscleJointTypes', 255).nullable()
      table.integer('priority').nullable()
      table.integer('gender').nullable()
      table.integer('ageGround').nullable()
      table.integer('ageCeiling').nullable()
      table.integer('weightGround').nullable()
      table.integer('weightCeiling').nullable()
    })

    const excelFilePath = path.join(process.cwd(), '/data-access/migrations/exercise-data/exercises-data.xlsx')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(excelFilePath)
    const sheet = workbook.worksheets[0]

    // استخراج سرفصل‌ها و نگاشت به camelCase
    const headerRow = sheet.getRow(1)
    const rawHeaders = (headerRow.values as string[]).slice(1) // حذف مقدار null اولیه
    const toCamel = (s: string) =>
      customCamelCase(s.replace(/[\-*#]/g, '').replace(/[^\w\s]/g, '').trim())

    const renamedHeaders = rawHeaders.map(toCamel)

    // تغییر نام اولین و آخرین ستون
    renamedHeaders[0] = 'name'
    renamedHeaders[renamedHeaders.length - 1] = 'target'

    // فیلتر ستون‌های مورد نیاز
    const columnsToKeep = new Set([
      'name',
      'nameFa',
      'inDepthYoutubeExplanation',
      'shortYoutubeDemonstration',
      'targetMuscleGroup',
      'difficultyLevel',
      'primaryEquipment',
      'secondaryEquipment',
      'bodyRegion',
      'mechanics',
      'target',
    ])

    // ستون‌هایی که برای ستون اصلی عضلات نیاز داریم (اما در نهایت به دیتابیس نمی‌روند)
    const processingColumns = new Set([
      'primeMoverMuscle',
      'secondaryMuscle',
      'tertiaryMuscle',
    ])

    const records: any[] = []

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i)
      const rowData: any = {}
      const processingData: any = {} // برای ذخیره موقت ستون‌های پردازشی

      // ابتدا تمام داده‌ها را بخوانید (هم برای پردازش و هم برای ذخیره)
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        const key = rawHeaders.map(customCamelCase)[colNumber - 1]

        // ذخیره ستون‌های پردازشی
        if (processingColumns.has(key)) {
          let val = typeof cell.value === 'string' ? cell.value.trim() : cell.value
          if (['Unsorted', 'Unsorted*', 'unsorted', 'none', 'None'].includes(String(val)))
            val = ''
          processingData[key] = val ?? ''
          return
        }

        // ذخیره ستون‌های اصلی
        if (columnsToKeep.has(key)) {
          if (key === 'inDepthYoutubeExplanation' || key === 'shortYoutubeDemonstration') {
            const hyperlink = cell.hyperlink || null
            const value = typeof cell.value === 'string' ? cell.value.trim() : null
            rowData[key] = hyperlink || value
          }
          else {
            let val = typeof cell.value === 'string' ? cell.value.trim() : cell.value
            if (['Unsorted', 'Unsorted*', 'unsorted', 'none', 'None'].includes(String(val)))
              val = ''

            if (key === 'target') {
              const targetMap: Record<string, string> = {
                'Calisthenics': 'endurance',
                'Grinds': 'endurance',
                'Animal Flow': '',
                'Plyometric': 'strength',
                'Olympic Weightlifting': 'strength',
                'Powerlifting': 'strength',
                'Ballistics': 'strength',
                'Bodybuilding': 'hypertrophy',
                'Postural': 'postural',
                'Mobility': 'mobility',
                'Balance': 'balance',
              }
              val = targetMap[val as string] ?? val
            }

            rowData[key] = val ?? ''
          }
        }
      })

      // تنظیم کردن مقادیر ستون عضله ها
      if (rowData.targetMuscleGroup) {
        // const primeMover = (processingData.primeMoverMuscle || '').toLowerCase();
        // const secondaryMuscle = (processingData.secondaryMuscle || '').toLowerCase();
        // const tertiaryMuscle = (processingData.tertiaryMuscle || '').toLowerCase();
        const targetMuscle = rowData.targetMuscleGroup.toLowerCase()

        // جایگزینی مقدار Trapezius با trap
        if (targetMuscle === 'trapezius') {
          rowData.targetMuscleGroup = 'trap'
        }
        // کلی سازی عضلات مرتبط با پا
        else if (targetMuscle === 'hip flexors' || targetMuscle === 'quadriceps' || targetMuscle === 'glutes' || targetMuscle === 'calves' || targetMuscle === 'hamstrings' || targetMuscle === 'shins' || targetMuscle === 'adductors' || targetMuscle === 'abductors') {
          rowData.targetMuscleGroup = 'legs'
        }
        // پردازش جایگزینی مقدار Back
        else if (targetMuscle === 'back') {
          rowData.targetMuscleGroup = 'back and lat'
        }

        records.push(rowData)
      }
    }

    let autoIncrementId = 1
    const mappedRecords = records.map(row => ({
      number: autoIncrementId++, // شماره حرکت تمرینی
      id: uuidv4(),
      name: row.name || '',
      nameFa: row.nameFa || '',
      shortYoutubeDemonstration: row.shortYoutubeDemonstration,
      inDepthYoutubeExplanation: row.inDepthYoutubeExplanation,
      difficultyLevel: row.difficultyLevel ? row.difficultyLevel.toLowerCase() : null,
      targetMuscleGroup: row.targetMuscleGroup ? row.targetMuscleGroup.toLowerCase() : null,
      primaryEquipment: row.primaryEquipment ? row.primaryEquipment.toLowerCase() : null,
      secondaryEquipment: row.secondaryEquipment ? row.secondaryEquipment.toLowerCase() : null,
      bodyRegion: row.bodyRegion ? row.bodyRegion.toLowerCase() : null,
      mechanics: row.mechanics ? row.mechanics.toLowerCase() : null,
      target: row.target || null,
      gender: row.gender || null,
      ageCeiling: row.ageCeiling || null,
      ageGround: row.ageGround || null,
      weightCeiling: row.weightCeiling || null,
      weightGround: row.weightGround || null,
    }))

    // بصورت تکه تکه وارد دیتابیس میشن رکورد ها
    const chunkSize = 500
    await knex.batchInsert('plan_exercises', mappedRecords, chunkSize)
    console.log(`✅ Inserted ${mappedRecords.length} records into plan_exercises.`)
  }
}
