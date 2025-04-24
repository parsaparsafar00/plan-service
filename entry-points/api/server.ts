import type { FastifyInstance } from 'fastify'
import type { Knex } from 'knex'
import { fastifyAutoQueryPlugin } from '@amard/auto-query'
import { envConfig } from '@amard/config-manager'
import { errorHandler, fastifyErrorPlugin } from '@amard/error-handling'
import { fastifyHealthCheckPlugin } from '@amard/health-check'
import { fastifyApiLoggerPlugin } from '@amard/logger'
import { fastifyRequestContextPlugin } from '@amard/requests-context'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import Fastify from 'fastify'
import { planRoutes } from './routes/plan-routes.js'
import { systemRoutes } from './routes/system-routes.js'
import { templateRoutes } from './routes/template-routes.js'
import { exerciseRoutes } from './routes/exercise-routes.js'
import { techniqueRoutes } from './routes/technique-routes.js'
import { OpenAPIOptions, OpenAPIUIOptions } from './open-api-helper.js'
import { planRoutes } from './plan-routes.js'

let app: FastifyInstance | undefined

export async function startWebServer(knexInstance: Knex): Promise<FastifyInstance> {
  app = Fastify({
    logger: false,
    disableRequestLogging: true,
    ignoreDuplicateSlashes: true,
    ignoreTrailingSlash: false,
    requestTimeout: 19000, // 19 seconds
    connectionTimeout: 9000, // 9 seconds
    bodyLimit: 1048576, // 1 MB
  })

  errorHandler.listenToErrorEvents()
  app.register(fastifyErrorPlugin)

  // Swagger
  app.register(fastifySwagger, OpenAPIOptions)
  app.register(fastifySwaggerUi, OpenAPIUIOptions)

  // RequestContext
  app.register(fastifyRequestContextPlugin, { serviceName: 'plan-service' })
  
  // Logger
  app.register(fastifyApiLoggerPlugin, { serviceName: 'plan-service' })

  // فیلدهای مجاز برای فیلترینگ و سورت
  const tableNames = ['plan_records']
  const allColumns = (await Promise.all(tableNames.map(table => knexInstance(table).columnInfo().then(info => Object.keys(info))))).flat()
  app.register(fastifyAutoQueryPlugin, { allowedFilterFields: allColumns, allowedSortFields: allColumns })

  // Health Check
  app.register(fastifyHealthCheckPlugin, {
    serviceName: 'plan-service',
    readiness: {
      checkPostgres: { knexInstance },
      // اگر نیاز است checkRedis هم اضافه کنید
    },
  })

  // ثبت روت ها
  app.register(planRoutes, { prefix: '/v1/plan' })
  app.register(systemRoutes, { prefix: '/v1/plan' })
  app.register(exerciseRoutes, { prefix: '/v1/plan' })
  app.register(techniqueRoutes, { prefix: '/v1/plan' })
  app.register(templateRoutes, { prefix: '/v1/plan' })

  // پورت از محیط
  const port = envConfig.get('PlanServicePort')
  await app.listen({ host: '0.0.0.0', port })
  return app
}

export async function stopWebServer() {
  if (app) {
    try {
      await app.close()
    }
    finally {
      app = undefined
    }
  }
}
