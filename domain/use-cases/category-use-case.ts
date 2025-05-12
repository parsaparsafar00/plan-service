import type { AutoQueryData } from '@amard/auto-query'
import type { FastifyRequest } from 'fastify'
import type * as catSchemas from '../schemas/category-schema.js'
import type * as generalSchema from '../schemas/plan-general-schema.js'
import { checkWithACL } from '@amard/access-control'
import { AppError } from '@amard/error-handling'
import { auditLogger, setAuditRequest } from '@amard/logger'
import { DateTime } from 'luxon'
import { validate as isValidUuid, v4 as uuidv4 } from 'uuid'
import * as categoryRepository from '../../data-access/category-repository.js'

const internalSvcId = 'internal-service-user-id'
const internalSvcRole = 'internal-service-user-role'

function extractSenderData(request: FastifyRequest) {
  const underJwt = request.underJwt === 'true'
  let role = internalSvcRole
  let userId = internalSvcId

  if (underJwt) {
    role = request.user!.role
    userId = request.user!.id
  }

  return { role, userId }
}

export async function createCategory(request: FastifyRequest<{ Body: catSchemas.CreateCategoryRequestType, Querystring: generalSchema.IdQueryTeacherType }>): Promise<catSchemas.CategoryType> {
  const { userId: creatorId, role: creatorRole } = extractSenderData(request)
  let teacherId = creatorId
  let isGlobal = false
  if (creatorRole === 'admin') {
    teacherId = request.query.id
    isGlobal = request.body.isGlobal || false

    if (!isGlobal) {
      if (!isValidUuid(teacherId))
        throw new AppError('PLAN_CATEGORY_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
    }
  }

  // بررسی تکراری بودن
  const existing = await categoryRepository.getCategoryByTitle(teacherId, request.body.title)
  if (existing)
    throw new AppError('PLAN_CATEGORY_ALREADY_EXISTS', 'Category already exists', 400)

  const now = DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')!
  const newCategory: catSchemas.CategoryType = {
    id: uuidv4(),
    teacherId,
    title: request.body.title,
    isGlobal,
    createdAt: now,
    updatedAt: now,
  }
  const createdCategory = await categoryRepository.insertCategory(newCategory)
  auditLogger.create('', { request: setAuditRequest(request), oldData: null, newData: createdCategory })
  return createdCategory
}

/**
 * گرفتن یک کتگوری بر اساس آیدی
 */
export async function getCategoryById(request: FastifyRequest<{ Params: catSchemas.IdParamType }>): Promise<catSchemas.CategoryType> {
  const capturedCategory = await categoryRepository.getCategoryById(request.params.id)
  if (!capturedCategory) throw new AppError('PLAN_CATEGORY_NOT_FOUND', 'Category not found', 404)

  const { userId: receiverId, role: getterRole } = extractSenderData(request)
  let aclResult = { isOkay: false, reason: '' }

  if (getterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (capturedCategory.teacherId === receiverId), isGlobal: (capturedCategory.isGlobal) })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_CATEGORY_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  return capturedCategory
}

export async function getTeacherCategories(request: FastifyRequest<{ Querystring: generalSchema.IdQueryTeacherType }>): Promise<catSchemas.CategoryType[]> {
  const { userId: tokenUserId, role: tokenUserRole } = extractSenderData(request)
  let teacherId = tokenUserId
  if (tokenUserRole === 'admin') {
    teacherId = request.query.id
    if (!isValidUuid(teacherId))
      throw new AppError('PLAN_CATEGORY_TEACHER_ID_INVALID', 'Teacher ID is invalid', 400)
  }

  return await categoryRepository.getAllTeacherCategories(teacherId, request.autoQueryData as AutoQueryData)
}

export async function getAllCategories(request: FastifyRequest): Promise<catSchemas.CategoryType[]> {
  return await categoryRepository.getCategories(request.autoQueryData as AutoQueryData)
}

export async function updateCategory(request: FastifyRequest<{ Body: catSchemas.UpdateCategoryRequestType, Params: catSchemas.IdParamType }>): Promise<catSchemas.CategoryType> {
  const currentCategory = await categoryRepository.getCategoryById(request.params.id)
  if (!currentCategory) {
    throw new AppError('PLAN_CATEGORY_NOT_FOUND', 'Category not found', 404)
  }

  const { userId: updaterId, role: updaterRole } = extractSenderData(request)
  let aclResult = {
    isOkay: false,
    reason: '',
  }
  if (updaterRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (updaterId === currentCategory.teacherId), isGlobal: (currentCategory.isGlobal), ...request.body })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_CATEGORY_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  const updatedCategory = await categoryRepository.updateCategory(currentCategory.id, {
    title: request.body.title,
    updatedAt: DateTime.now().setZone('Asia/Tehran').toFormat('yyyy-LL-dd HH:mm:ss')!,
  })

  auditLogger.update('', { request: setAuditRequest(request), oldData: currentCategory, newData: updatedCategory })
  return updatedCategory
}

export async function deleteCategory(request: FastifyRequest<{ Params: catSchemas.IdParamType }>): Promise<void> {
  const currentCategory = await categoryRepository.getCategoryById(request.params.id)
  if (!currentCategory) {
    throw new AppError('PLAN_CATEGORY_NOT_FOUND', 'Category not found', 404)
  }
  const { userId: removerId, role: removerRole } = extractSenderData(request)
  let aclResult = {
    isOkay: false,
    reason: '',
  }
  if (removerRole === 'teacher') {
    aclResult = await checkWithACL(request, { own: (removerId === currentCategory.teacherId), isGlobal: currentCategory.isGlobal })
    if (!aclResult.isOkay)
      throw new AppError('PLAN_CATEGORY_ACTION_IS_FORBIDDEN', aclResult.reason, 403)
  }

  //----
  // حتی اگه ادمین یه کتگوری گلوبال رو حذف بکنه تابع زیر میگرده یه کتگوری گلوبال دیگه پیدا میکنه و به کاربران اختصاص میده
  const generalCategory = await categoryRepository.getGeneralCategory()
  await categoryRepository.changeCategoryToGlobal(currentCategory.id, generalCategory!.id)

  await categoryRepository.deleteCategory(currentCategory.id)
  //----
  // میشه اتومیک یا تراکنشی زد

  auditLogger.delete('', { request: setAuditRequest(request), oldData: currentCategory, newData: null })
}