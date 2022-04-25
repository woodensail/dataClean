# 数据清洗

数据清洗主要针对异步数据进行整理和转化，填充缺失的数据结构和字段。

一方面保证接口中约定的字段一定能正常取到不会报错，另一方面可以用于代码提示和检查，便于开发并减少拼写错误

### 使用范例
```js
// 第一步，导入清洗方法，分严格和非严格模式两种，根据需求自选，具体区别后面介绍
// 清洗方法的入参有两个，第一个是待清洗的数据，第二个是schema
import {strictClean, clean} from '@/utils/dataClean'
// 第二步，定义schema，根据接口提供的文档写出空数据接口。
// 如果是数组格式，需要在数组中写一个对象，清洗时会跟据数组中第一个元素的结构进行清洗
const searchSchema = {
  errorCode: null, content: {
    products: {
      count: 0, rows: [{
        skuTitle: '',
        hasStock: true,
        areaPrice: 0,
        promotion: { pmprice: 0 },
        skuId: 0,
        skuPicCdnUrl: '',
        marketLabel: '',
        marketInfo: { ruleType: 0, ruleSubType: 0, taskType: 0, ruleToken: '', floorPrice: '', link: '' }
      }]
    }
  }
}
// 第三步，在页面的state定义部分中先用null清洗一份空数据放入state中。
// 保证页面能够正常的进行代码提示，同时保证无数据状态下渲染不会报错。
state={
    products: strictClean(null, searchSchema).content.products.rows,
}

// 第四步，在代码执行时获取到数据后直接放入清洗方法中进行清洗，之后再对数据进行进一步操作
const result = strictClean((await request()), searchSchema)
// 该取值符合shcema定义，书写过程中有代码提示，且可以保证运行时不会出现取值异常
result.content.products.count
// 不符合shcema定义，书写过程中有product部分会报红
result.content.product.count
// 该取值符合shcema定义，有代码提示且不报红。
// 但是需要注意实际运行时rows中可能数据量不足。
// 因此仅能保证对数组进行forEach/map等遍历操作时无异常
// 直接下标取值时，若对应数据不存在仍有可能出现异常
result.content.products.rows[5].skuId
```

### 清洗模式说明
需要说明的是严格模式和非严格模式在执行时是一样的，并不影响最终清洗结果。区别只是代码校验时的严格程度
1. strictClean
   严格模式，只能使用schema中声明了的字段，使用任何schema中不存在的字段都会报红
2. clean
   非严格模式，schema中声明了的字段可以正常使用，没有声明的字段则视为(string | number | boolean | null | undefined)的联合类型，
   允许当做简单数据进行使用，但当做数组和对象使用会报错。
   该模式下一些仅用于渲染的字段可以不在schema中声明，依然可以保证运行时无异常，不过可能渲染出undefined或其他意外的内容

### 数据类型介绍
在schema中将一个字段定义为不同的类型会有不同的操作，具体如下
- number  强制类型转换为数字，并使用0兜底
- string  强制类型转换为字符串，并使用空字符串兜底
- boolean 强制类型转换为布尔型
- object  递归执行，对取到的值按该字段对应部分的schema进行清洗
- array   如果源数据不是数组，强制返回空数组；否则依照遍历改数组并进行清洗
- null    不做任何清洗，直接返回原始值，一般使用于错误码等场景，避免破坏原始信息

### 代码提示效果范例
```js
// 定义目标数据结构
const schema = {
  a: '',
  b: 1,
  c: [{d: ''}],
  o: {}
}
const result = clean(null, schema)
result.a        // 不报错， 类型为string
result.b        // 不报错， 类型为number
result.c        // 不报错， 类型为数组
result.c[0].d   // 不报错， 类型为string
result.c[1].d   // 不报错， 类型为string
result.c[1].a   // 不报错， 类型为string | number | boolean | null | undefined
result.c[1].a.a // 报错
result.d        // 不报错， 类型为string | number | boolean | null | undefined
result.d.d      // 报错
result.o        // 不报错， 类型为object
result.o.a      // 不报错， 类型为string | number | boolean | null | undefined
result.o.a.a    // 报错
```
