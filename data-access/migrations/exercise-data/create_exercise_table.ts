import type { Knex } from 'knex'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse as csvParse } from 'fast-csv'
import { v4 as uuidv4 } from 'uuid'

// تابع برای تولید اولیه جدول حرکات
export async function initExerciseTable(knex: Knex): Promise<void> {
  const tableExists = await knex.schema.hasTable('plan_exercises')
  if (!tableExists) {
    await knex.schema.createTable('plan_exercises', (table) => {
      table.uuid('id').primary()
      table.string('name', 255).notNullable()
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
      table.integer('gender').nullable() // 0=male, 1=female, or null
      table.integer('ageGround').nullable()
      table.integer('ageCeiling').nullable()
      table.integer('weightGround').nullable()
      table.integer('weightCeiling').nullable()
      table.string('target', 50).nullable()
      table.string('mechanics', 50).nullable()
    })

    const __dirname = process.cwd()
    const csvFilePath = path.join(__dirname, '/data-access/migrations/exercise-data/exercises-data.csv')
    if (fs.existsSync(csvFilePath)) {
      // با fast-csv بخوانیم
      const records: any[] = await new Promise((resolve, reject) => {
        const rows: any[] = []
        fs.createReadStream(csvFilePath)
          .pipe(csvParse({ headers: true, ignoreEmpty: true, trim: true }))
          .on('error', error => reject(error))
          .on('data', row => rows.push(row))
          .on('end', (rowCount: number) => {
            console.log(`Parsed ${rowCount} rows from CSV file.`)
            resolve(rows)
          })
      })

      const mappedRecords = records.map((row) => {
        return {
          id: uuidv4(),
          name: row.name || '',
          shortYoutubeDemonstration: row.shortYoutubeDemonstration || null,
          inDepthYoutubeExplanation: row.inDepthYoutubeExplanation || null,
          difficultyLevel: row.difficultyLevel || null,
          targetMuscleGroup: row.targetMuscleGroup || null,
          primeMoverMuscle: row.primeMoverMuscle || null,
          secondaryMuscle: row.secondaryMuscle || null,
          tertiaryMuscle: row.tertiaryMuscle || null,
          primaryEquipment: row.primaryEquipment || null,
          secondaryEquipment: row.secondaryEquipment || null,
          numberOfItems: row.numberOfItems ? Number(row.numberOfItems) : null,
          posture: row.posture || null,
          singleOrDoubleArm: row.singleOrDoubleArm || null,
          grip: row.grip || null,
          loadPositionAtTheEnd: row.loadPositionAtTheEnd || null,
          footElevation: row.footElevation || null,
          comboExercises: row.comboExercises || null,
          movementPattern: row.movementPattern || null,
          movementPattern2: row.movementPattern2 || null,
          movementPattern3: row.movementPattern3 || null,
          bodyRegion: row.bodyRegion || null,
          forceType: row.forceType || null,
          laterality: row.laterality || null,
          exerciseClassification: row.exerciseClassification || null,
          muscleJointTypes: row.muscleJointTypes || null,
          priority: row.priority ? Number(row.priority) : null,
          gender: row.gender ? Number(row.gender) : null,
          ageGround: row.ageGround ? Number(row.ageGround) : null,
          ageCeiling: row.ageCeiling ? Number(row.ageCeiling) : null,
          weightGround: row.weightGround ? Number(row.weightGround) : null,
          weightCeiling: row.weightCeiling ? Number(row.weightCeiling) : null,
          target: row.target || null,
          mechanics: row.mechanics || null,
        }
      })
      // درج در دیتابیس با chunk
      const chunkSize = 500
      await knex.batchInsert('plan_exercises', mappedRecords, chunkSize)
    }
  }
}
