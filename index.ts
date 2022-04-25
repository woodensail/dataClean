/**
 * 数据清洗方法，使用方式如下
 *
 * // 定义目标数据结构
 * const schema = {
 *   a: '',
 *   b: 1,
 *   c: [{d: ''}],
 *   o: {}
 * }
 *
 * const result = clean(null, schema)
 * result.a        // 不报错， 类型为string
 * result.b        // 不报错， 类型为number
 * result.c        // 不报错， 类型为数组
 * result.c[0].d   // 不报错， 类型为string
 * result.c[1].d   // 不报错， 类型为string
 * result.c[1].a   // 不报错， 类型为string | number | boolean | null | undefined
 * result.c[1].a.a // 报错
 * result.d        // 不报错， 类型为string | number | boolean | null | undefined
 * result.d.d      // 报错
 * result.o        // 不报错， 类型为object
 * result.o.a      // 不报错， 类型为string | number | boolean | null | undefined
 * result.o.a.a    // 报错
 */

import isArray from 'lodash/isArray'
import isPlainObject from 'lodash/isPlainObject'
import mapValues from 'lodash/mapValues'
import mergeWith from 'lodash/mergeWith'

// // 数据清洗方法，使用方式如下
// // 定义目标数据结构
// const schema = {
//   a: '',
//   b: 1,
//   c: [{ d: '' }],
//   o: {},
//   anyKey: { __key__: 0 } // 使用__key__关键字声明任意key值
// }
//
// const result = clean(null, schema)
// result.a        // 不报错， 类型为string
// result.b        // 不报错， 类型为number
// result.c        // 不报错， 类型为数组
// result.c[0].d   // 不报错， 类型为string
// result.c[1].d   // 不报错， 类型为string
// result.c[1].a   // 不报错， 类型为string | number | boolean | null | undefined
// result.c[1].a.a // 报错
// result.d        // 不报错， 类型为string | number | boolean | null | undefined
// result.d.d      // 报错
// result.o        // 不报错， 类型为object
// result.o.a      // 不报错， 类型为string | number | boolean | null | undefined
// result.o.a.a    // 报错
// result.anyKey   // 不报错， 类型为object，且该object所有value值都是number
// result.anyKey.a // 不报错， 类型为number
// result.anyKey.b // 不报错， 类型为number

export type Wrapper<T> = {
  [P in keyof T]: (T[P] extends Array<any> ? Array<Wrapper<T[P][0]>> :
    T[P] extends { __key__: any } ? { [key: string]: Wrapper<T[P]['__key__']> | undefined } :
      T[P] extends string ? string :
        T[P] extends number ? number :
          T[P] extends boolean ? boolean :
            T[P] extends object ? Wrapper<T[P]> :
              T[P] extends null ? string | number | boolean | null | undefined :
                Base);
} & Base

export type StrictWrapper<T> = {
  [P in keyof T]: (T[P] extends Array<any> ? Array<StrictWrapper<T[P][0]>> :
    T[P] extends { __key__: any } ? { [key: string]: StrictWrapper<T[P]['__key__']> | undefined } :
      T[P] extends string ? string :
        T[P] extends number ? number :
          T[P] extends boolean ? boolean :
            T[P] extends object ? StrictWrapper<T[P]> :
              T[P] extends null ? string | number | boolean | null | undefined | {} :
                Base);
}
type Base = {
  [key: string]: string | number | boolean | null | undefined;
}

export function clean<T>(src, schema: T): Wrapper<T> {
  const mergeFun = (srcValue, schemaValue) => {
    const srcType = typeof srcValue
    const schemaType = typeof schemaValue
    if (isArray(schemaValue)) { // 目标格式是数组
      if (isArray(srcValue)) { // 如果源数据是数组，则对数组中的数据进行清洗
        return srcValue.map(srcItem => {
          const itemType = typeof schemaValue[0]
          if ('boolean' === itemType) {  // 目标类型为布尔型
            // 强制类型转换为布尔型
            return !!srcItem
          } else if ('number' === itemType) {  // 目标类型为数字
            // 强制类型转换为数字，并使用0兜底
            return Number(srcItem) || 0
          } else if ('string' === itemType) {  // 目标类型为数字
            // 强制类型转换为字符串，并使用空字符串兜底
            return (srcItem === null || srcItem === void 0) ? '' : srcItem.toString()
          }
          return mergeWith(srcItem, schemaValue[0], mergeFun)
        });
      } else { // 如果源数据不是数组，强制返回空数组
        return [];
      }
    } else if (isPlainObject(schemaValue)) {  // 目标类型为普通对象
      // 如果schema中有__key__字段，则将原始值中所有的所有value按照__key__下定义的schema进行处理
      if (schemaValue.__key__) {
        if(isPlainObject(srcValue)){
          return mapValues(srcValue, value => mergeWith(value, schemaValue.__key__, mergeFun))
        }else{
          return {}
        }
      }
      // 对该对象进行数据清洗
      return mergeWith(srcValue, schemaValue, mergeFun)
    } else if (srcType === schemaType || schemaType === 'undefined') {  // 如果源数据格式与兜底一致或没有目标格式则直接返回
      return srcValue; // 如果源数据格式与兜底一致则取源数据
    } else if ('boolean' === schemaType) {  // 目标类型为布尔型
      // 强制类型转换为布尔型
      return !!srcValue
    } else if ('number' === schemaType) {  // 目标类型为数字
      // 强制类型转换为数字，并使用0兜底
      return Number(srcValue) || 0
    } else if ('string' === schemaType) {  // 目标类型为数字
      // 强制类型转换为字符串，并使用空字符串兜底
      return (srcValue === null || srcValue === void 0) ? '' : srcValue.toString()
    }
    // null 或其他数据类型不做任何处理，直接返回源数据
    return srcValue;
  };
  return mergeWith(src, schema, mergeFun);
}


export function strictClean<T>(src, schema: T): StrictWrapper<T> {
  return clean(src, schema) as any
}
