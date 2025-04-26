import type { RawServerBase } from 'fastify'
import type { Knex } from 'knex'
import type { AddressInfo } from 'node:net'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { initCasbin } from '@amard/access-control'
import { AppError, errorHandler } from '@amard/error-handling'
import { logger } from '@amard/logger'
import { closeKnexConnection, createKnexInstance } from '@amard/postgresql-connection'
import { loadAllExercises, setKnexInstanceForExerciseRepo } from './data-access/exercise-repository.js'
import { initExerciseTable } from './data-access/migrations/exercise-data/create_exercise_table.js'
import { setKnexInstanceForTrainHelperRepo } from './data-access/migrations/repos/plan-helper-repository.js'
import { setKnexInstanceForPlanRepo } from './data-access/migrations/repos/plan-repository.js'
import { setKnexInstanceForSystemRepo } from './data-access/migrations/repos/system-repository.js'
import { setKnexInstanceForTechniqueRepo } from './data-access/migrations/repos/technique-repository.js'
import { setKnexInstanceForTemplateRepo } from './data-access/migrations/repos/template-repository.js'
import { startWebServer, stopWebServer } from './entry-points/api/server.js'

let isShuttingDown = false
let knexInstance: Knex | null = null

async function shutDownServer(reason: string, error?: Error) {
  if (isShuttingDown) {
    logger.warn('Plan-service: Shutdown already in progress...')
    return
  }
  isShuttingDown = true

  try {
    logger.warn(`Plan-service: Shutting down due to ${reason}`, { error })

    // توقف سرور وب
    await stopWebServer()
    // قطع اتصال دیتابیس
    await closeKnexConnection()
    // موارد پاکسازی اینجا قرار میگیرن

    logger.warn('Plan-service: Shut down gracefully.')
    process.exit(0)
  }
  catch (err) {
    if (err instanceof Error)
      errorHandler.handleError(new AppError('PLAN_SERVICE_SHUTDOWN_FAILURE', `Failed to shut down Plan-service: ${err.message}`, 500, err))
    else
      errorHandler.handleError(new AppError('PLAN_SERVICE_SHUTDOWN_FAILURE', 'Failed to shut down Plan-service: Unknown error', 500))

    process.exit(1)
  }
}

errorHandler.configure({ shutDownServer })

export async function startServer(): Promise<RawServerBase> {
  try {
    logger.info('Plan-service: Starting...')

    // بارگذاری پالیسی Casbin
    await initCasbin('plan-service')

    // مایگریشن
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const migrationsDirectory = path.join(__dirname, 'data-access/migrations')

    knexInstance = createKnexInstance({
      directory: migrationsDirectory,
      tableName: 'knex_migrations_plan_service',
    })

    // ساختن جدول حرکات به همراه ورود دیتاها، در صورت عدم وجود (باید اول این جدول تولید بشه چرا که جداول دیگه ازش فارین کی میگیرن)
    await initExerciseTable(knexInstance)

    await knexInstance.migrate.latest()
    setKnexInstanceForExerciseRepo(knexInstance)
    setKnexInstanceForPlanRepo(knexInstance)
    setKnexInstanceForSystemRepo(knexInstance)
    setKnexInstanceForTemplateRepo(knexInstance)
    setKnexInstanceForTechniqueRepo(knexInstance)
    setKnexInstanceForTrainHelperRepo(knexInstance)

    // لود کردن تمام حرکات درون یک متغیر آرایه ای سراسری
    await loadAllExercises()

    // شروع وب سرور
    const app = await startWebServer(knexInstance)
    // گرفتن آدرس سرور
    // گرفتن آدرس سرور
    const addressInfo = app.server.address() as AddressInfo
    logger.info(`plan-service: Started on port ${addressInfo.port}`)

    return app.server
  }
  catch (error) {
    if (error instanceof Error)
      errorHandler.handleError(new AppError('PLAN_SERVICE_STARTUP_FAILURE', `Failed to start Plan-service: ${error.message}`, 500, error))
    else
      errorHandler.handleError(new AppError('PLAN_SERVICE_STARTUP_FAILURE', 'Failed to start Plan-service: Unknown error', 500))

    process.exit(1)
  }
}

const planServer = startServer()
export { planServer }
