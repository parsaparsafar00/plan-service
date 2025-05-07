import type { AutoQueryData } from '@amard/auto-query'
import type { Knex } from 'knex'
import type { CategoryType } from '../domain/schemas/category-schema.js'
import { attachAutoQuery } from '@amard/auto-query'
import { AppError } from '@amard/error-handling'

let knexInstance: Knex

export function setKnexInstanceForCategoryRepo(instance: Knex) {
  knexInstance = instance
}

export async function insertCategory(data: CategoryType): Promise<CategoryType> {
  try {
    const [inserted] = await knexInstance('plan_categories').insert(data).returning('*')
    return inserted
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database insertCategory error', 500, error)
  }
}

export async function getCategoryById(id: string): Promise<CategoryType> {
  try {
    return await knexInstance('plan_categories').where({ id }).first()
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database getCategoryById error', 500, error)
  }
}

export async function getCategoryByTitle(teacherId: string, title: string): Promise<CategoryType> {
  try {
    const category = await knexInstance('plan_categories').where({ teacherId }).andWhere({ title }).first()
    return category
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database getCategoryByTitle error', 500, error)
  }
}

// برای ادمین در موارد خاص که میخواد کل کتگوری ها رو ببینه 
export async function getCategories(autoQueryData: AutoQueryData): Promise<CategoryType[]> {
  try {
    const categories = await knexInstance('plan_categories').modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
    return categories
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database getCategories error', 500, error)
  }
}

export async function getAllTeacherCategories(teacherId: string, autoQueryData: AutoQueryData): Promise<CategoryType[]> {
  try {
    const categories = await knexInstance('plan_categories').where({ teacherId }).orWhere({ isGlobal: true }).modify((qb) => {
      attachAutoQuery(qb, autoQueryData)
    })
    return categories
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database getAllTeacherCategories error', 500, error)
  }
}

export async function updateCategory(id: string, updatedFields: Partial<CategoryType>): Promise<CategoryType> {
  try {
    const [updated] = await knexInstance('plan_categories').where({ id }).update(updatedFields).returning('*')
    return updated
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database updateCategory error', 500, error)
  }
}

export async function getGeneralCategory(): Promise<CategoryType | undefined> {
  try {
    const category = await knexInstance('plan_categories').where({ isGlobal: true }).andWhere({ title: 'عمومی' }).first()
    return category
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database getGeneralCategory error', 500, error)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await knexInstance('plan_categories').where({ id }).del()
  }
  catch (error) {
    throw new AppError('PLAN_CATEGORY_DB_ERROR', 'Database deleteCategory error', 500, error)
  }
}

export async function changeCategoryToGlobal(currentCatId: string, globalCatId: string): Promise<void> {
  // این برای یه دونه نیست چون زمانیکه ما توی جدولی 
  // where
  // بزنیم
  // و بعدش 
  //update
  // بزنیم
  // همه چیزایی که با 
  // where
  // پیدا شدن رو آپدیت میکنه
  try {
    await knexInstance('plan_templates').where({ categoryId: currentCatId }).update({ categoryId: globalCatId })
  }
  catch (error) {
    throw new AppError('USER_CATEGORY_DB_ERROR', 'Database changeCategoryToGlobal error', 500, error)
  }
}