import type { FastifyRequest } from 'fastify'
import type * as systemSchema from '../schemas/system-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as systemRepo from '../../data-access/migrations/repos/system-repository.js'

/**
 * تولید سیستم برنامه تمرینی
 */
export async function createPlanSystem(request: FastifyRequest<{ Body: systemSchema.CreatePlanSystemRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newSystem: systemSchema.SystemType = {
    id: uuidv4(),
    abbrName: "سیستم " + request.body.method + " " + request.body.repeatPattern.toString(),
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    repeatPattern: request.body.repeatPattern,
    status: 'active',
    createdAt: nowStr,
    updatedAt: nowStr,
  }

  const inserted = await systemRepo.insertPlanSystem(newSystem)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllSystemsByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('SYSTEM_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const systems = await systemRepo.getAllSystemsByTeacherId(request.params.id)

  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: systems })
  return systems
}
