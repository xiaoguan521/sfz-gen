/**
 * 地址生成工具
 * 提供中国地址生成相关的功能
 */

const Mock = require('mockjs');

/**
 * 小区名称生成器
 * @returns {string} 生成的小区名称
 */
function generateCommunityName() {
  const prefixes = ['龙湖', '万科', '恒大', '碧桂园', '保利', '绿地', '华润', '中海', '金地', '招商', 
                   '融创', '世茂', '富力', '雅居乐', '远洋', '旭辉', '金茂', '华夏', '阳光', '和谐'];
  const suffixes = ['花园', '小区', '家园', '公馆', '华府', '名苑', '御景', '豪庭', '新城', '康城', 
                   '雅苑', '佳园', '丽都', '天地', '世家', '水岸', '翠园', '尚城', '名都', '御府'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix}`;
}

/**
 * 商业建筑名称生成器
 * @returns {string} 生成的商业建筑名称
 */
function generateBuildingName() {
  const prefixes = ['国际', '环球', '中央', '东方', '西部', '南方', '北方', '万达', '嘉禾', '金融', 
                   '商贸', '科技', '数字', '创新', '未来', '时代', '世纪', '和平', '兴盛', '繁华'];
  const suffixes = ['广场', '中心', '大厦', '商城', '大楼', '大厦', '商务楼', '写字楼', '大厦', '中心'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix}`;
}

/**
 * 生成住宅小区详细地址
 * @returns {string} 小区详细地址
 */
function generateResidentialAddress() {
  const communityName = generateCommunityName();
  const buildingNo = Math.floor(Math.random() * 30) + 1;
  const unitNo = Math.floor(Math.random() * 6) + 1;
  const roomNo = Math.floor(Math.random() * 2) + 1 + Math.floor(Math.random() * 30) * 100;
  
  return `${communityName}${buildingNo}号楼${unitNo}单元${roomNo}室`;
}

/**
 * 生成街道地址
 * @returns {string} 街道地址
 */
function generateStreetAddress() {
  const street = Mock.Random.cword(2, 4) + '路';
  const number = Mock.Random.natural(1, 1000);
  
  return `${street}${number}号`;
}

/**
 * 生成商业建筑地址
 * @returns {string} 商业建筑地址
 */
function generateCommercialAddress() {
  const buildingName = generateBuildingName();
  const floorNo = Math.floor(Math.random() * 20) + 1;
  const roomNo = Math.floor(Math.random() * 10) + 1;
  
  return `${buildingName}${floorNo}层${roomNo}号`;
}

/**
 * 根据比例生成详细地址
 * @param {number} communityRatio 小区住宅比例，默认0.6
 * @param {number} streetRatio 普通街道比例，默认0.3
 * @param {number} buildingRatio 商业建筑比例，默认0.1
 * @returns {string} 详细地址
 */
function generateDetailedAddress(communityRatio = 0.6, streetRatio = 0.3, buildingRatio = 0.1) {
  const random = Math.random();
  
  if (random < communityRatio) {
    return generateResidentialAddress();
  } else if (random < communityRatio + streetRatio) {
    return generateStreetAddress();
  } else {
    return generateCommercialAddress();
  }
}

module.exports = {
  generateCommunityName,
  generateBuildingName,
  generateResidentialAddress,
  generateStreetAddress,
  generateCommercialAddress,
  generateDetailedAddress
}; 