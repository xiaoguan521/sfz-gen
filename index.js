const ChineseIdGenerator = require('./src/idGenerator');

module.exports = {
  ChineseIdGenerator
};

// 以下是示例代码，仅在直接运行此文件时执行
if (require.main === module) {
  // 创建生成器实例
  const generator = new ChineseIdGenerator();

  // 示例1：生成单个身份证号
  const idCard = generator.generateIdCard();
  console.log('生成的身份证号:', idCard);

  // 示例2：生成指定地区的身份证号（北京市朝阳区）
  const beijingIdCard = generator.generateIdCard({ areaCode: '110105' });
  console.log('北京朝阳区身份证号:', beijingIdCard);

  // 示例3：生成指定出生日期的身份证号
  const specificBirthIdCard = generator.generateIdCard({ birthday: '19900101' });
  console.log('1990年1月1日出生的身份证号:', specificBirthIdCard);

  // 示例4：生成指定性别的身份证号（1为男，0为女）
  const maleIdCard = generator.generateIdCard({ gender: 1 });
  console.log('男性身份证号:', maleIdCard);

  // 示例5：生成完整的个人信息
  const personInfo = generator.generatePersonInfo();
  console.log('\n完整的个人信息:');
  console.log(JSON.stringify(personInfo, null, 2));

  // 示例6：批量生成5个人的信息
  console.log('\n批量生成5个人的信息:');
  const people = generator.generateBatch(5);
  console.log(JSON.stringify(people, null, 2));

  // 示例7：批量生成特定条件的人员信息（例如：上海市的女性）
  console.log('\n上海市的女性:');
  const shanghaiWomen = generator.generateBatch(3, { 
    areaCode: '310000',  // 上海市
    gender: 0            // 女性
  });
  console.log(JSON.stringify(shanghaiWomen, null, 2));
}