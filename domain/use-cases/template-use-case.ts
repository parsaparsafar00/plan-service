import type { FastifyRequest } from 'fastify'
import type * as templateSchema from '../schemas/template-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as templateRepo from '../../data-access/migrations/repos/template-repository.js'

/**
 * تولید قالب 
 */
export async function createTemplate(request: FastifyRequest<{ Body: templateSchema.CreateTemplateRequestType }>) {
  if (!isValidUuid(request.body.teacherId)) throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    
  const nowStr = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss') // useTz=false در migration
  const newTemplate : templateSchema.TemplateType = {
    id: uuidv4(),
    name: request.body.name,
    teacherId: request.body.teacherId,
    description: request.body.description,
    level: request.body.level,
    target: request.body.target,
    muscles: request.body.muscles,
    createdAt: nowStr,
    updatedAt: nowStr,
  }
  
  const inserted = await templateRepo.insertTemplate(newTemplate)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: inserted })
  return inserted
}

/**
 * گرفتن همه قالب های برنامه مربی
 */
export async function getAllTechniquesByTeacherId(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)
    return await templateRepo.getAllTemplatesByTeacherId(request.params.id)
}

/**
 * گرفتن اطلاعات قالب بر اساس آیدی قالب
 */
export async function getTemplateById(request: FastifyRequest<{ Params: generalSchema.IdParamType }>) {
  if (!isValidUuid(request.params.id)) throw new AppError('TEMPLATE_OWNER_ID_INVALID', 'Teacher ID is invalid', 400)

    return await templateRepo.getTemplateById(request.params.id)
}