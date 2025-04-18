import type { FastifyRequest } from 'fastify'
import type * as techniqueSchema from '../schemas/technique-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as techniqueRepo from '../../data-access/migrations/repos/technique-repository.js'

/**
 * تولید تکنیک
 */
export async function createTechnique(request: FastifyRequest<{ Body: techniqueSchema.CreateTechniqueRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('PLAN_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTechnique: techniqueSchema.TechniqueType = {
    id: uuidv4(),
    abbrName: "تکنیک " + request.body.method + " " + request.body.name,
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    descIsVisible: request.body.descIsVisible,
    method: request.body.method,
    status: 'active',
    createdAt: nowStr,
    updatedAt: nowStr,
  }
  
  const inserted = await techniqueRepo.insertTechnique(newTechnique)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه سیستم های برنامه تمرینی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('TECHNIQUE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

  const techniques = await techniqueRepo.getTechniquesByTeacherId(request.params.id)

  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: techniques })
  return techniques
}
