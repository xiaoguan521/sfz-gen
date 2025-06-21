const ChineseIdGenerator = require('../src/idGenerator');

// 创建生成器实例
const generator = new ChineseIdGenerator();

/**
 * 通过地区名称和年龄生成身份证信息
 * @param {string} area 地区名称，如：武汉、北京、上海等
 * @param {number} age 年龄
 * @param {number} gender 性别，1为男，0为女，不传则随机
 * @returns {Object} 身份证信息
 */
function generateIdByAreaAndAge(area, age, gender) {
  try {
    const options = {};
    if (gender !== undefined) {
      options.gender = gender;
    }
    
    const personInfo = generator.generatePersonInfoByAreaAndAge(area, age, options);
    
    console.log(`生成成功：${area}，${age}岁，${personInfo.gender}`);
    console.log(`姓名：${personInfo.name}`);
    console.log(`身份证号：${personInfo.idCard}`);
    console.log(`地区：${personInfo.areaName}`);
    console.log(`出生日期：${personInfo.birthDate}`);
    console.log(`手机号：${personInfo.phone}`);
    console.log(`邮箱：${personInfo.email}`);
    console.log(`地址：${personInfo.address}`);
    console.log('-----------------------------------');
    
    return personInfo;
  } catch (error) {
    console.error(`生成失败：${error.message}`);
    return null;
  }
}

// 示例1：生成武汉市27岁男性的身份证信息
generateIdByAreaAndAge('武汉', 27, 1);

// 示例2：生成北京市35岁女性的身份证信息
generateIdByAreaAndAge('石家庄', 35, 0);

// 示例3：生成上海市25岁随机性别的身份证信息
generateIdByAreaAndAge('藁城', 25);

// 示例4：生成特定区域的身份证信息
generateIdByAreaAndAge('朝阳区', 30);
generateIdByAreaAndAge('黄浦区', 40);

// 示例5：测试新添加的地区
console.log("\n测试新添加的地区：");
generateIdByAreaAndAge('石家庄', 32);
generateIdByAreaAndAge('邢台', 28);
generateIdByAreaAndAge('济南', 40);
generateIdByAreaAndAge('青岛', 35);

// 示例6：批量生成不同地区、不同年龄的身份证信息
console.log("\n批量生成不同地区、不同年龄的身份证信息：");
const testCases = [
  { area: '广州', age: 22 },
  { area: '深圳', age: 28 },
  { area: '杭州', age: 35 },
  { area: '西安', age: 45 },
  { area: '成都', age: 50 }
];

testCases.forEach(({ area, age }) => {
  generateIdByAreaAndAge(area, age);
}); 