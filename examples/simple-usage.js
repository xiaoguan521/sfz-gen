/**
 * 简单使用示例
 * 
 * 运行方式：node examples/simple-usage.js
 */

// 导入生成器
const ChineseIdGenerator = require('../src');

// 创建生成器实例
const generator = new ChineseIdGenerator();

console.log('=== 中国身份证号生成器(sfz-gen)使用示例 ===\n');

// 1. 生成随机身份证号
const idCard = generator.generateIdCard();
console.log('1. 随机身份证号:', idCard);

// 2. 生成指定条件的身份证号
const maleIdCard = generator.generateIdCard({ gender: 1 });
console.log('2. 男性身份证号:', maleIdCard);

const femaleIdCard = generator.generateIdCard({ gender: 0 });
console.log('3. 女性身份证号:', femaleIdCard);

const beijingIdCard = generator.generateIdCard({ areaCode: '110101' });
console.log('4. 北京市东城区身份证号:', beijingIdCard);

// 3. 生成完整的个人信息
const person = generator.generatePersonInfo();
console.log('\n5. 随机个人信息:');
console.log(JSON.stringify(person, null, 2));

// 4. 根据地区名称和年龄生成个人信息
const beijingPerson = generator.generatePersonInfoByAreaAndAge('北京', 30);
console.log('\n6. 北京市30岁人员信息:');
console.log(JSON.stringify(beijingPerson, null, 2));

// 5. 批量生成个人信息
console.log('\n7. 批量生成5条记录:');
const startTime = Date.now();
const people = generator.generateBatch(5);
const endTime = Date.now();
console.log(`生成耗时: ${endTime - startTime}ms`);
people.forEach((p, index) => {
  console.log(`\n记录 ${index + 1}:`);
  console.log(`姓名: ${p.name}`);
  console.log(`性别: ${p.gender}`);
  console.log(`年龄: ${p.age}`);
  console.log(`身份证: ${p.idCard}`);
  console.log(`地址: ${p.address}`);
});

// 6. 使用插件系统
console.log('\n8. 使用插件系统:');
generator.registerPlugin('nameGenerator', () => '张三丰');
generator.registerPlugin('phoneGenerator', () => '13800138000');

const customPerson = generator.generatePersonInfo();
console.log(JSON.stringify(customPerson, null, 2));

console.log('\n=== 示例结束 ==='); 