/**
 * sfz-gen - 中国身份证号生成器
 * 
 * 一个强大的中国身份证号码和个人信息生成工具，可以生成符合规则的身份证号码、姓名、性别、年龄、手机号、邮箱、地址等信息。
 * 
 * @module sfz-gen
 */

const ChineseIdGenerator = require('./idGenerator');

// 导出主类
module.exports = ChineseIdGenerator;

// 兼容CommonJS和ES模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = ChineseIdGenerator;
} 