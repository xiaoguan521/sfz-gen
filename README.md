# 中国身份证号生成器 (sfz-gen)

一个强大的中国身份证号码和个人信息生成工具，可以生成符合规则的身份证号码、姓名、性别、年龄、手机号、邮箱、地址等信息。

## 特性

- 生成符合校验规则的18位中国居民身份证号码
- 支持指定地区编码、出生日期、性别等参数
- 可以生成包含姓名、性别、年龄、手机号、邮箱、地址等完整的个人信息
- 支持批量生成，并提供进度回调
- 支持通过地区名称和年龄生成符合条件的身份证
- 支持模糊匹配地区名称
- 高性能设计，支持大批量数据生成
- 插件系统，支持自定义生成规则
- 丰富的配置选项，支持自定义姓氏、名字长度等
- 模块化设计，易于扩展和维护

## 安装

```bash
npm install sfz-gen
```

## 基本用法

```javascript
const ChineseIdGenerator = require('sfz-gen');

// 创建生成器实例
const generator = new ChineseIdGenerator();

// 生成随机身份证号
const idCard = generator.generateIdCard();
console.log('随机身份证号:', idCard);

// 生成指定条件的身份证号
const maleIdCard = generator.generateIdCard({ gender: 1 }); // 男性
const femaleIdCard = generator.generateIdCard({ gender: 0 }); // 女性
const beijingIdCard = generator.generateIdCard({ areaCode: '110101' }); // 北京市东城区
const bornIn1990 = generator.generateIdCard({ birthday: '19900101' }); // 1990年1月1日出生

// 生成完整的个人信息
const person = generator.generatePersonInfo();
console.log('个人信息:', person);
/*
输出示例:
{
  name: '张三',
  gender: '男',
  age: 35,
  birthDate: '1988-05-20',
  idCard: '110101198805201234',
  phone: '13812345678',
  email: 'zhangsan123@qq.com',
  address: '北京市东城区龙湖花园3号楼2单元502室',
  areaName: '东城区'
}
*/

// 批量生成个人信息
const people = generator.generateBatch(10);
console.log(`已生成 ${people.length} 条记录`);

// 批量生成并显示进度
generator.generateBatch(1000, {}, (progress) => {
  console.log(`生成进度: ${Math.floor(progress * 100)}%`);
});

// 根据地区名称和年龄生成个人信息
const beijingPerson = generator.generatePersonInfoByAreaAndAge('北京', 30);
const shanghaiPerson = generator.generatePersonInfoByAreaAndAge('上海', 25);
```

## 高级用法

### 配置选项

```javascript
// 创建带配置的生成器实例
const generator = new ChineseIdGenerator({
  // 延迟加载数据，适合只需要少量生成的场景
  lazyLoad: false,
  
  // 启用缓存，提高性能
  enableCache: true,
  
  // 预计算模糊匹配，提高地区查询性能
  precomputeFuzzyMatch: true,
  
  // 姓名生成选项
  nameOptions: {
    // 指定姓氏列表
    surnames: ['张', '王', '李', '赵', '刘'],
    
    // 指定名字长度，如[1, 2]表示1-2个字的名
    nameLengths: [1, 2]
  },
  
  // 地址生成选项
  addressOptions: {
    // 小区住宅比例
    communityRatio: 0.6,
    
    // 普通街道比例
    streetRatio: 0.3,
    
    // 商业建筑比例
    buildingRatio: 0.1
  }
});
```

### 插件系统

```javascript
// 自定义姓名生成插件
generator.registerPlugin('nameGenerator', (gender) => {
  // gender: 1为男，0为女
  return gender === 1 ? '张三丰' : '赵敏';
});

// 自定义手机号生成插件
generator.registerPlugin('phoneGenerator', () => {
  return '13800138000';
});

// 自定义邮箱生成插件
generator.registerPlugin('emailGenerator', (name) => {
  return `${name}@example.com`;
});

// 自定义地址生成插件
generator.registerPlugin('addressGenerator', (areaCode, areaName) => {
  return `${areaName}自定义地址`;
});

// 移除插件
generator.removePlugin('nameGenerator');
```

## 性能

- 初始化时间: ~20ms
- 单个身份证号生成: ~1ms
- 单个完整个人信息生成: ~10ms
- 批量生成100条记录: ~30ms
- 批量生成1000条记录: ~150ms

## 单元测试

```bash
# 运行单元测试
npx jest
```

## 许可证

MIT 