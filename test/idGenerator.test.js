/**
 * 单元测试
 * 
 * 使用 Jest 测试框架运行：npx jest
 */

const ChineseIdGenerator = require('../src/idGenerator');
const IdValidator = require('id-validator');

describe('ChineseIdGenerator', () => {
  let generator;
  let validator;
  
  beforeEach(() => {
    generator = new ChineseIdGenerator();
    validator = new IdValidator();
  });
  
  test('生成的身份证号应该是有效的', () => {
    const idCard = generator.generateIdCard();
    expect(validator.isValid(idCard)).toBe(true);
  });
  
  test('生成的身份证号应该符合指定的地区编码', () => {
    const areaCode = '110101'; // 北京市东城区
    const idCard = generator.generateIdCard({ areaCode });
    expect(idCard.substring(0, 6)).toBe(areaCode);
    expect(validator.isValid(idCard)).toBe(true);
  });
  
  test('生成的身份证号应该符合指定的出生日期', () => {
    const birthday = '19900101';
    const idCard = generator.generateIdCard({ birthday });
    expect(idCard.substring(6, 14)).toBe(birthday);
    expect(validator.isValid(idCard)).toBe(true);
  });
  
  test('生成的身份证号应该符合指定的性别', () => {
    // 男性，身份证倒数第二位为奇数
    const maleIdCard = generator.generateIdCard({ gender: 1 });
    const maleOrderCode = parseInt(maleIdCard.charAt(16));
    expect(maleOrderCode % 2).toBe(1);
    expect(validator.isValid(maleIdCard)).toBe(true);
    
    // 女性，身份证倒数第二位为偶数
    const femaleIdCard = generator.generateIdCard({ gender: 0 });
    const femaleOrderCode = parseInt(femaleIdCard.charAt(16));
    expect(femaleOrderCode % 2).toBe(0);
    expect(validator.isValid(femaleIdCard)).toBe(true);
  });
  
  test('生成的个人信息应该包含所有必要字段', () => {
    const person = generator.generatePersonInfo();
    expect(person).toHaveProperty('name');
    expect(person).toHaveProperty('gender');
    expect(person).toHaveProperty('age');
    expect(person).toHaveProperty('birthDate');
    expect(person).toHaveProperty('idCard');
    expect(person).toHaveProperty('phone');
    expect(person).toHaveProperty('email');
    expect(person).toHaveProperty('address');
    expect(validator.isValid(person.idCard)).toBe(true);
  });
  
  test('批量生成应该返回指定数量的记录', () => {
    const count = 10;
    const people = generator.generateBatch(count);
    expect(people.length).toBe(count);
    
    // 验证每个记录的身份证号都是有效的
    people.forEach(person => {
      expect(validator.isValid(person.idCard)).toBe(true);
    });
  });
  
  // 新增测试：测试地址生成
  test('生成的地址应该包含省市区信息', () => {
    const person = generator.generatePersonInfoByAreaAndAge('北京', 25);
    expect(person.address).toContain('北京市');
    
    const person2 = generator.generatePersonInfoByAreaAndAge('上海', 30);
    expect(person2.address).toContain('上海市');
    
    const person3 = generator.generatePersonInfoByAreaAndAge('武汉', 35);
    expect(person3.address).toContain('湖北省');
    expect(person3.address).toContain('武汉市');
  });
  
  // 新增测试：测试详细地址格式
  test('生成的地址应该符合中国地址格式', () => {
    for (let i = 0; i < 10; i++) {
      const person = generator.generatePersonInfo();
      
      // 检查地址格式：应该不包含多余的空格
      expect(person.address).not.toContain('  ');
      
      // 地址应该以"号"、"室"或其他合理的结尾
      expect(person.address).toMatch(/[号室]$/);
    }
  });
  
  // 新增测试：测试插件系统
  test('插件系统应该正常工作', () => {
    const customName = '张三丰';
    const customPhone = '13800138000';
    const customEmail = 'test@example.com';
    
    // 注册自定义插件
    generator.registerPlugin('nameGenerator', () => customName);
    generator.registerPlugin('phoneGenerator', () => customPhone);
    generator.registerPlugin('emailGenerator', () => customEmail);
    
    const person = generator.generatePersonInfo();
    
    expect(person.name).toBe(customName);
    expect(person.phone).toBe(customPhone);
    expect(person.email).toBe(customEmail);
    
    // 移除插件后应该恢复默认行为
    generator.removePlugin('nameGenerator');
    const person2 = generator.generatePersonInfo();
    expect(person2.name).not.toBe(customName);
  });
  
  // 新增测试：测试自定义姓名选项
  test('自定义姓名选项应该生效', () => {
    const customSurnames = ['赵', '钱', '孙', '李'];
    const customNameLengths = [1];
    
    const customGenerator = new ChineseIdGenerator({
      nameOptions: {
        surnames: customSurnames,
        nameLengths: customNameLengths
      }
    });
    
    const person = customGenerator.generatePersonInfo();
    
    // 姓氏应该在指定列表中
    const surname = person.name.charAt(0);
    expect(customSurnames).toContain(surname);
    
    // 名字长度应该符合要求
    expect(person.name.length).toBe(2); // 姓(1) + 名(1) = 2
  });
  
  // 新增测试：测试性能优化
  test('批量生成性能测试', () => {
    const startTime = Date.now();
    const count = 100;
    const people = generator.generateBatch(count);
    const endTime = Date.now();
    
    console.log(`批量生成${count}条记录耗时: ${endTime - startTime}ms`);
    expect(people.length).toBe(count);
  });
}); 