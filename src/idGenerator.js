const Mock = require('mockjs');
const IdValidator = require('id-validator');
const pinyinUtils = require('./utils/pinyin');
const addressUtils = require('./utils/address');
const { province, city, area, town } = require('province-city-china/data');

/**
 * 中国身份证号生成器
 * 用于生成符合规则的中国身份证号码和个人信息
 */
class ChineseIdGenerator {
  /**
   * 创建身份证生成器实例
   * @param {Object} options 配置选项
   * @param {boolean} options.lazyLoad 是否延迟加载数据，默认为false
   * @param {boolean} options.enableCache 是否启用缓存，默认为true
   * @param {boolean} options.precomputeFuzzyMatch 是否预计算模糊匹配，默认为false
   * @param {Object} options.nameOptions 姓名生成选项
   * @param {Array<string>} options.nameOptions.surnames 指定姓氏列表
   * @param {Array<number>} options.nameOptions.nameLengths 指定名字长度列表，如[1, 2]
   * @param {Object} options.addressOptions 地址生成选项
   * @param {number} options.addressOptions.communityRatio 小区住宅比例，默认0.6
   * @param {number} options.addressOptions.streetRatio 普通街道比例，默认0.3
   * @param {number} options.addressOptions.buildingRatio 商业建筑比例，默认0.1
   */
  constructor(options = {}) {
    this.idValidator = new IdValidator();
    this.initialized = false;
    
    // 配置选项
    this.options = {
      lazyLoad: options.lazyLoad || false,
      enableCache: options.enableCache !== undefined ? options.enableCache : true,
      precomputeFuzzyMatch: options.precomputeFuzzyMatch || false,
      nameOptions: {
        surnames: options.nameOptions?.surnames || null,
        nameLengths: options.nameOptions?.nameLengths || null
      },
      addressOptions: {
        communityRatio: options.addressOptions?.communityRatio || 0.6,
        streetRatio: options.addressOptions?.streetRatio || 0.3,
        buildingRatio: options.addressOptions?.buildingRatio || 0.1
      }
    };
    
    // 使用Map结构存储数据关系，提高查询效率
    this.provinceMap = new Map();
    this.cityMap = new Map();
    this.areaMap = new Map();
    this.townMap = new Map();
    
    // 缓存结构
    this._cache = {
      areaCodeByName: new Map(),
      nameByAreaCode: new Map(),
      randomAreaCodes: null,
      fuzzyAreaNameMap: null
    };
    
    // 插件系统
    this._plugins = {
      nameGenerator: null,
      phoneGenerator: null,
      emailGenerator: null,
      addressGenerator: null,
      idCardGenerator: null
    };
    
    // 常用城市映射
    this.commonCities = {
      '北京': '110000',
      '上海': '310000',
      '天津': '120000',
      '重庆': '500000',
      '广州': '440100',
      '深圳': '440300',
      '武汉': '420100',
      '南京': '320100',
      '杭州': '330100',
      '西安': '610100',
      '成都': '510100'
    };
    
    // 常量定义
    this.ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    this.ID_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    this.EMAIL_DOMAINS = ['qq.com', '163.com', 'gmail.com', '126.com', 'outlook.com', 'sina.com', 'sohu.com'];
    this.DIRECT_CITIES = ['11', '12', '31', '50']; // 北京、天津、上海、重庆
    
    // 常用姓氏
    this.COMMON_SURNAMES = [
      '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
      '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
      '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
      '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕'
    ];
    
    // 如果不是延迟加载，立即初始化数据
    if (!this.options.lazyLoad) {
      this._initData();
      
      // 如果配置了预计算模糊匹配，则立即构建
      if (this.options.precomputeFuzzyMatch) {
        this._buildFuzzyAreaNameCache();
      }
    }
  }

  /**
   * 注册插件
   * @param {string} type 插件类型，可选值：nameGenerator, phoneGenerator, emailGenerator, addressGenerator, idCardGenerator
   * @param {Function} plugin 插件函数
   * @returns {ChineseIdGenerator} 当前实例，支持链式调用
   */
  registerPlugin(type, plugin) {
    if (!this._plugins.hasOwnProperty(type)) {
      throw new Error(`不支持的插件类型: ${type}`);
    }
    
    if (typeof plugin !== 'function') {
      throw new Error('插件必须是函数');
    }
    
    this._plugins[type] = plugin;
    return this;
  }

  /**
   * 移除插件
   * @param {string} type 插件类型
   * @returns {ChineseIdGenerator} 当前实例，支持链式调用
   */
  removePlugin(type) {
    if (this._plugins.hasOwnProperty(type)) {
      this._plugins[type] = null;
    }
    return this;
  }

  /**
   * 初始化地区数据
   * @private
   */
  _initData() {
    if (this.initialized) return;
    
    // 一次性构建所有数据映射，减少循环次数
    this._buildProvinceMaps();
    this._buildCityMaps();
    this._buildAreaMaps();
    this._buildTownMaps();
    
    this.initialized = true;
  }
  
  /**
   * 构建省份映射
   * @private
   */
  _buildProvinceMaps() {
    province.forEach(p => {
      this.provinceMap.set(p.province, p);
      this._addAreaCodeMapping(p.code, p.name);
    });
  }
  
  /**
   * 构建城市映射
   * @private
   */
  _buildCityMaps() {
    city.forEach(c => {
      if (!this.cityMap.has(c.province)) {
        this.cityMap.set(c.province, new Map());
      }
      this.cityMap.get(c.province).set(c.city, c);
      
      const provinceName = this._getProvinceName(c.province);
      const fullName = `${provinceName}${c.name}`;
      this._addAreaCodeMapping(c.code, fullName);
      this._addAreaCodeMapping(c.code, c.name); // 添加简化名称映射
    });
  }
  
  /**
   * 构建区县映射
   * @private
   */
  _buildAreaMaps() {
    area.forEach(a => {
      if (!this.areaMap.has(a.province)) {
        this.areaMap.set(a.province, new Map());
      }
      if (!this.areaMap.get(a.province).has(a.city)) {
        this.areaMap.get(a.province).set(a.city, new Map());
      }
      this.areaMap.get(a.province).get(a.city).set(a.area, a);
      
      const provinceName = this._getProvinceName(a.province);
      const cityInfo = this._getCityInfo(a.province, a.city);
      const cityName = cityInfo ? cityInfo.name : '';
      const fullName = `${provinceName}${cityName}${a.name}`;
      
      this._addAreaCodeMapping(a.code, fullName);
      this._addAreaCodeMapping(a.code, a.name); // 添加简化名称映射
    });
  }
  
  /**
   * 构建乡镇映射
   * @private
   */
  _buildTownMaps() {
    town.forEach(t => {
      if (!this.townMap.has(t.code)) {
        this.townMap.set(t.code, []);
      }
      this.townMap.get(t.code).push(t);
    });
  }
  
  /**
   * 添加地区编码双向映射
   * @param {string} code 地区编码
   * @param {string} name 地区名称
   * @private
   */
  _addAreaCodeMapping(code, name) {
    if (!this._cache.areaCodeByName.has(name)) {
      this._cache.areaCodeByName.set(name, code);
    }
    this._cache.nameByAreaCode.set(code, name);
  }

  /**
   * 确保数据已初始化
   * @private
   */
  _ensureInitialized() {
    if (!this.initialized) {
      this._initData();
    }
  }

  /**
   * 根据省份编码获取省份名称
   * @param {string} provinceCode 省份编码
   * @returns {string} 省份名称
   * @private
   */
  _getProvinceName(provinceCode) {
    // 修复：在初始化过程中调用此方法时不再调用_ensureInitialized
    // 避免循环依赖导致的堆栈溢出
    if (!this.initialized && this.provinceMap.has(provinceCode)) {
      const province = this.provinceMap.get(provinceCode);
      return province ? province.name : '';
    }
    
    this._ensureInitialized();
    const province = this.provinceMap.get(provinceCode);
    return province ? province.name : '';
  }

  /**
   * 根据城市编码获取城市信息
   * @param {string} provinceCode 省份编码
   * @param {string} cityCode 城市编码
   * @returns {Object|null} 城市信息对象
   * @private
   */
  _getCityInfo(provinceCode, cityCode) {
    // 修复：在初始化过程中调用此方法时不再调用_ensureInitialized
    // 避免循环依赖导致的堆栈溢出
    if (!this.initialized) {
      return this.cityMap.has(provinceCode) && this.cityMap.get(provinceCode).has(cityCode) 
        ? this.cityMap.get(provinceCode).get(cityCode) 
        : null;
    }
    
    this._ensureInitialized();
    return this.cityMap.has(provinceCode) && this.cityMap.get(provinceCode).has(cityCode) 
      ? this.cityMap.get(provinceCode).get(cityCode) 
      : null;
  }

  /**
   * 根据区县编码获取乡镇街道列表
   * @param {string} areaCode 区县编码
   * @returns {Array} 乡镇街道列表
   * @private
   */
  _getTownsByAreaCode(areaCode) {
    this._ensureInitialized();
    return this.townMap.get(areaCode) || [];
  }

  /**
   * 生成有效的中国身份证号码
   * @param {Object} options 选项
   * @param {string} options.areaCode 地区编码，如：110101 (北京市东城区)
   * @param {string} options.birthday 出生日期，格式：YYYYMMDD
   * @param {number} options.gender 性别，1为男，0为女
   * @returns {string} 有效的身份证号码
   */
  generateIdCard(options = {}) {
    this._ensureInitialized();
    
    // 验证输入参数
    this._validateIdCardOptions(options);
    
    // 如果没有提供地区编码，随机选择一个有效的地区编码
    const areaCode = options.areaCode || this._getRandomAreaCode();
    
    // 如果没有提供出生日期，生成一个随机的出生日期（1950-2005年）
    const birthday = options.birthday || this._getRandomBirthday();
    
    // 如果没有提供性别，随机生成性别
    const gender = options.gender !== undefined ? options.gender : Math.round(Math.random());
    
    // 生成符合性别要求的顺序码
    const sequenceCode = this._generateSequenceCode(gender);

    // 前17位
    const idCardBase = `${areaCode}${birthday}${sequenceCode}`;
    
    // 计算校验码
    const checkCode = this._calculateCheckCode(idCardBase);
    
    return idCardBase + checkCode;
  }

  /**
   * 验证身份证生成选项
   * @param {Object} options 选项
   * @private
   */
  _validateIdCardOptions(options) {
    if (options.areaCode && !/^\d{6}$/.test(options.areaCode)) {
      throw new Error('地区编码必须是6位数字');
    }
    
    if (options.birthday && !/^\d{8}$/.test(options.birthday)) {
      throw new Error('出生日期必须是8位数字，格式为YYYYMMDD');
    }
    
    if (options.gender !== undefined && ![0, 1].includes(options.gender)) {
      throw new Error('性别必须是0(女)或1(男)');
    }
  }

  /**
   * 生成符合性别要求的顺序码
   * @param {number} gender 性别，1为男，0为女
   * @returns {string} 3位顺序码
   * @private
   */
  _generateSequenceCode(gender) {
    // 生成1-999之间的随机数
    let num = Math.floor(Math.random() * 999) + 1;
    
    // 确保性别正确：男性为奇数，女性为偶数
    const isOdd = num % 2 === 1;
    
    if ((gender === 1 && !isOdd) || (gender === 0 && isOdd)) {
      num = num + (gender === 1 ? 1 : -1);
      // 处理边界情况
      if (num > 999) num = 999;
      if (num < 1) num = 2;
    }
    
    return this._pad(num, 3);
  }

  /**
   * 生成完整的中国人信息
   * @param {Object} options 选项
   * @returns {Object} 包含姓名、性别、年龄、身份证、手机号、邮箱等信息的对象
   */
  generatePersonInfo(options = {}) {
    this._ensureInitialized();
    
    // 确定性别
    const gender = options.gender !== undefined ? options.gender : Math.round(Math.random());
    
    // 生成身份证
    const idCard = this._generateIdCardWithPlugin({
      areaCode: options.areaCode,
      birthday: options.birthday,
      gender: gender
    });
    
    // 从身份证号提取信息
    const { birthYear, birthMonth, birthDay, age, formattedBirthDate } = this._extractInfoFromIdCard(idCard);
    
    // 生成姓名（根据性别）
    const name = this._generateNameWithPlugin(gender);
    
    // 生成手机号
    const phone = this._generatePhoneWithPlugin();
    
    // 生成邮箱
    const email = this._generateEmailWithPlugin(name);
    
    // 获取地区信息
    const areaCode = idCard.substring(0, 6);
    const areaName = this._getAreaNameByCode(areaCode) || '未知地区';
    
    // 生成地址
    const address = this._generateAddressWithPlugin(areaCode);
    
    return {
      name,
      gender: gender === 1 ? '男' : '女',
      age,
      birthDate: formattedBirthDate,
      idCard,
      phone,
      email,
      address,
      areaName
    };
  }

  /**
   * 使用插件生成姓名
   * @param {number} gender 性别，1为男，0为女
   * @returns {string} 姓名
   * @private
   */
  _generateNameWithPlugin(gender) {
    // 如果有自定义插件，使用插件生成
    if (this._plugins.nameGenerator) {
      try {
        const result = this._plugins.nameGenerator(gender);
        if (result && typeof result === 'string') {
          return result;
        }
      } catch (error) {
        console.warn('姓名生成插件出错:', error);
      }
    }
    
    // 使用自定义姓名生成
    return this._generateCustomName(gender);
  }

  /**
   * 生成自定义姓名
   * @param {number} gender 性别，1为男，0为女
   * @returns {string} 姓名
   * @private
   */
  _generateCustomName(gender) {
    const { surnames, nameLengths } = this.options.nameOptions;
    
    // 如果配置了自定义姓氏，从中随机选择一个
    let surname;
    if (surnames && surnames.length > 0) {
      surname = surnames[Math.floor(Math.random() * surnames.length)];
    } else {
      // 否则从常用姓氏中选择
      surname = this.COMMON_SURNAMES[Math.floor(Math.random() * this.COMMON_SURNAMES.length)];
    }
    
    // 如果配置了名字长度，根据配置生成
    let nameLength;
    if (nameLengths && nameLengths.length > 0) {
      nameLength = nameLengths[Math.floor(Math.random() * nameLengths.length)];
    } else {
      // 否则随机1-2个字
      nameLength = Math.random() < 0.6 ? 1 : 2;
    }
    
    // 使用Mock.js生成名字部分
    const genderStr = gender === 1 ? 'male' : 'female';
    
    // 直接使用Mock.js的cname，但需要处理姓氏部分
    const fullName = Mock.Random.cname(genderStr);
    
    // 提取名字部分（去掉姓氏）
    const originalSurname = fullName.charAt(0);
    const originalName = fullName.substring(1);
    
    // 如果名字长度不符合要求，重新生成
    if (originalName.length !== nameLength) {
      // 简单处理：如果需要1个字但生成了2个，取第一个；如果需要2个字但生成了1个，加一个随机字
      let name;
      if (nameLength === 1 && originalName.length > 1) {
        name = originalName.charAt(0);
      } else if (nameLength === 2 && originalName.length < 2) {
        name = originalName + Mock.Random.cword(1);
      } else {
        name = Mock.Random.cword(nameLength);
      }
      return surname + name;
    }
    
    // 替换姓氏
    return surname + originalName;
  }

  /**
   * 使用插件生成手机号
   * @returns {string} 手机号
   * @private
   */
  _generatePhoneWithPlugin() {
    // 如果有自定义插件，使用插件生成
    if (this._plugins.phoneGenerator) {
      try {
        const result = this._plugins.phoneGenerator();
        if (result && typeof result === 'string' && /^1[3-9]\d{9}$/.test(result)) {
          return result;
        }
      } catch (error) {
        console.warn('手机号生成插件出错:', error);
      }
    }
    
    // 默认生成逻辑
    return Mock.mock(/^1[3-9]\d{9}$/);
  }

  /**
   * 使用插件生成邮箱
   * @param {string} name 姓名
   * @returns {string} 邮箱地址
   * @private
   */
  _generateEmailWithPlugin(name) {
    // 如果有自定义插件，使用插件生成
    if (this._plugins.emailGenerator) {
      try {
        const result = this._plugins.emailGenerator(name);
        if (result && typeof result === 'string' && result.includes('@')) {
          return result;
        }
      } catch (error) {
        console.warn('邮箱生成插件出错:', error);
      }
    }
    
    // 默认生成逻辑
    return this._generateEmail(name);
  }

  /**
   * 使用插件生成地址
   * @param {string} areaCode 地区编码
   * @returns {string} 地址
   * @private
   */
  _generateAddressWithPlugin(areaCode) {
    // 如果有自定义插件，使用插件生成
    if (this._plugins.addressGenerator) {
      try {
        const result = this._plugins.addressGenerator(areaCode, this._getAreaNameByCode(areaCode));
        if (result && typeof result === 'string') {
          return result;
        }
      } catch (error) {
        console.warn('地址生成插件出错:', error);
      }
    }
    
    // 默认生成逻辑
    return this._generateAddressByAreaCode(areaCode);
  }

  /**
   * 使用插件生成身份证号
   * @param {Object} options 选项
   * @returns {string} 身份证号
   * @private
   */
  _generateIdCardWithPlugin(options) {
    // 如果有自定义插件，使用插件生成
    if (this._plugins.idCardGenerator) {
      try {
        const result = this._plugins.idCardGenerator(options);
        if (result && typeof result === 'string' && this.idValidator.isValid(result)) {
          return result;
        }
      } catch (error) {
        console.warn('身份证生成插件出错:', error);
      }
    }
    
    // 默认生成逻辑
    return this.generateIdCard(options);
  }

  /**
   * 根据地区编码获取地区名称
   * @param {string} areaCode 地区编码
   * @returns {string|null} 地区名称
   * @private
   */
  _getAreaNameByCode(areaCode) {
    this._ensureInitialized();
    return this._cache.nameByAreaCode.get(areaCode) || null;
  }

  /**
   * 从身份证号提取信息
   * @param {string} idCard 身份证号
   * @returns {Object} 包含出生年月日、年龄等信息的对象
   * @private
   */
  _extractInfoFromIdCard(idCard) {
    // 提取出生日期（第7-14位）
    const birthYear = parseInt(idCard.substring(6, 10));
    const birthMonth = parseInt(idCard.substring(10, 12));
    const birthDay = parseInt(idCard.substring(12, 14));
    
    // 计算年龄
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    if (today.getMonth() + 1 < birthMonth || 
        (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
      age--;
    }
    
    // 格式化出生日期
    const formattedBirthDate = `${birthYear}-${this._pad(birthMonth, 2)}-${this._pad(birthDay, 2)}`;
    
    return { birthYear, birthMonth, birthDay, age, formattedBirthDate };
  }

  /**
   * 通过地区名称和年龄生成个人信息
   * @param {string} areaName 地区名称，如：武汉、上海、北京等
   * @param {number} age 年龄
   * @param {Object} options 其他选项
   * @returns {Object} 包含姓名、性别、年龄、身份证、手机号、邮箱等信息的对象
   */
  generatePersonInfoByAreaAndAge(areaName, age, options = {}) {
    this._ensureInitialized();
    
    // 参数验证
    if (!areaName) {
      throw new Error('地区名称不能为空');
    }
    
    if (age === undefined || age < 0 || age > 120) {
      throw new Error('年龄必须在0-120之间');
    }
    
    // 查找地区编码
    let areaCode = this._getAreaCodeByName(areaName);
    if (!areaCode) {
      // 增加容错机制，尝试使用默认地区编码
      console.warn(`未找到地区"${areaName}"的编码，将使用默认地区编码`);
      areaCode = '110101'; // 默认使用北京市东城区
    }
    
    // 处理市级编码，随机选择下属区县
    areaCode = this._resolveDistrictCode(areaCode);
    
    // 根据年龄计算出生日期
    const birthday = this._getBirthdayFromAge(age);
    
    // 生成个人信息
    return this.generatePersonInfo({
      ...options,
      areaCode,
      birthday
    });
  }

  /**
   * 处理市级编码，随机选择下属区县
   * @param {string} areaCode 地区编码
   * @returns {string} 区县编码
   * @private
   */
  _resolveDistrictCode(areaCode) {
    // 对于市级编码（以00结尾的6位编码），随机选择一个区县
    if (/^\d{4}00$/.test(areaCode)) {
      const provinceCode = areaCode.substring(0, 2);
      const cityCode = areaCode.substring(2, 4);
      
      // 判断是否为直辖市
      const isDirectCity = this.DIRECT_CITIES.includes(provinceCode);
      
      // 查找区县
      let districts;
      if (isDirectCity) {
        // 直辖市：只需要省级编码匹配
        districts = area.filter(a => 
          a.province === provinceCode && 
          a.name !== '市辖区'
        );
      } else {
        // 普通城市：需要省级编码和市级编码都匹配
        districts = area.filter(a => 
          a.province === provinceCode && 
          a.city === cityCode && 
          a.name !== '市辖区'
        );
      }
      
      if (districts && districts.length > 0) {
        // 随机选择一个区县
        const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
        return randomDistrict.code;
      }
    }
    
    return areaCode;
  }

  /**
   * 批量生成中国人信息
   * @param {number} count 生成数量
   * @param {Object} options 选项
   * @param {Function} progressCallback 进度回调函数，参数为当前进度(0-1)
   * @returns {Array} 人员信息数组
   */
  generateBatch(count, options = {}, progressCallback = null) {
    this._ensureInitialized();
    
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error('生成数量必须是正整数');
    }
    
    // 优化：预先计算和缓存可能需要的数据
    this._prepareBatchGeneration(options);
    
    const result = [];
    const batchSize = Math.min(count, 1000); // 每批最多处理1000条
    const batches = Math.ceil(count / batchSize);
    
    // 分批处理，避免大量数据导致的性能问题
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const currentBatchSize = (batchIndex === batches - 1) ? 
        (count - batchIndex * batchSize) : batchSize;
      
      // 当前批次的数据
      const batchResult = this._generateBatchInternal(currentBatchSize, options);
      result.push(...batchResult);
      
      // 报告进度
      if (progressCallback && typeof progressCallback === 'function') {
        const progress = Math.min((batchIndex + 1) * batchSize / count, 1);
        progressCallback(progress);
      }
    }
    
    return result;
  }

  /**
   * 内部批量生成方法
   * @param {number} count 生成数量
   * @param {Object} options 选项
   * @returns {Array} 人员信息数组
   * @private
   */
  _generateBatchInternal(count, options) {
    const result = [];
    
    // 如果指定了地区编码，预先获取地区信息
    let areaInfo = null;
    if (options.areaCode) {
      areaInfo = {
        code: options.areaCode,
        name: this._getAreaNameByCode(options.areaCode) || '未知地区'
      };
    }
    
    // 如果指定了出生日期，预先解析
    let birthInfo = null;
    if (options.birthday) {
      const birthYear = parseInt(options.birthday.substring(0, 4));
      const birthMonth = parseInt(options.birthday.substring(4, 6));
      const birthDay = parseInt(options.birthday.substring(6, 8));
      const formattedBirthDate = `${birthYear}-${this._pad(birthMonth, 2)}-${this._pad(birthDay, 2)}`;
      
      // 计算年龄
      const today = new Date();
      let age = today.getFullYear() - birthYear;
      if (today.getMonth() + 1 < birthMonth || 
          (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
        age--;
      }
      
      birthInfo = { birthYear, birthMonth, birthDay, age, formattedBirthDate };
    }
    
    for (let i = 0; i < count; i++) {
      // 确定性别
      const gender = options.gender !== undefined ? options.gender : Math.round(Math.random());
      
      // 生成身份证
      const idCard = this.generateIdCard({
        areaCode: options.areaCode,
        birthday: options.birthday,
        gender: gender
      });
      
      // 从身份证号提取信息
      const birthInfoFromId = birthInfo || this._extractInfoFromIdCard(idCard);
      
      // 生成姓名（根据性别）
      const name = this._generateNameWithPlugin(gender);
      
      // 生成手机号
      const phone = this._generatePhoneWithPlugin();
      
      // 生成邮箱
      const email = this._generateEmailWithPlugin(name);
      
      // 获取地区信息
      const areaCode = idCard.substring(0, 6);
      const areaName = areaInfo ? areaInfo.name : (this._getAreaNameByCode(areaCode) || '未知地区');
      
      // 生成地址
      const address = this._generateAddressWithPlugin(areaCode);
      
      result.push({
        name,
        gender: gender === 1 ? '男' : '女',
        age: birthInfoFromId.age,
        birthDate: birthInfoFromId.formattedBirthDate,
        idCard,
        phone,
        email,
        address,
        areaName
      });
    }
    
    return result;
  }

  /**
   * 为批量生成准备数据
   * @param {Object} options 选项
   * @private
   */
  _prepareBatchGeneration(options) {
    // 预热缓存
    if (!this._cache.randomAreaCodes) {
      this._getRandomAreaCode();
    }
    
    // 如果需要预计算模糊匹配但尚未计算
    if (this.options.precomputeFuzzyMatch && !this._cache.fuzzyAreaNameMap) {
      this._buildFuzzyAreaNameCache();
    }
  }

  /**
   * 获取随机的地区编码
   * @returns {string} 6位地区编码
   * @private
   */
  _getRandomAreaCode() {
    this._ensureInitialized();
    
    // 缓存有效的地区编码列表
    if (!this._cache.randomAreaCodes) {
      // 使用区县级数据作为身份证地区码，过滤掉以00结尾的编码
      // 直接使用area数组而不是从缓存中提取，减少遍历次数
      this._cache.randomAreaCodes = area
        .filter(areaItem => !areaItem.code.endsWith('00'))
        .map(areaItem => areaItem.code);
    }
    
    const codes = this._cache.randomAreaCodes;
    return codes[Math.floor(Math.random() * codes.length)];
  }

  /**
   * 根据地区名称获取地区编码
   * @param {string} areaName 地区名称
   * @returns {string|null} 地区编码，如果未找到则返回null
   * @private
   */
  _getAreaCodeByName(areaName) {
    this._ensureInitialized();
    
    // 1. 尝试直接匹配（最快）
    if (this._cache.areaCodeByName.has(areaName)) {
      return this._cache.areaCodeByName.get(areaName);
    }
    
    // 2. 检查常用城市映射（次快）
    if (this.commonCities[areaName]) {
      return this.commonCities[areaName];
    }
    
    // 3. 使用缓存进行模糊匹配
    // 如果之前没有构建模糊匹配缓存，则创建
    if (!this._cache.fuzzyAreaNameMap) {
      this._buildFuzzyAreaNameCache();
    }
    
    // 4. 查找以输入名称开头的地区
    const prefixMatches = this._cache.fuzzyAreaNameMap.prefix[areaName];
    if (prefixMatches && prefixMatches.length > 0) {
      return prefixMatches[0]; // 返回第一个匹配项
    }
    
    // 5. 查找包含输入名称的地区
    const includeMatches = this._cache.fuzzyAreaNameMap.include[areaName];
    if (includeMatches && includeMatches.length > 0) {
      return includeMatches[0]; // 返回第一个匹配项
    }
    
    return null;
  }

  /**
   * 构建模糊地区名称匹配缓存
   * @private
   */
  _buildFuzzyAreaNameCache() {
    // 初始化模糊匹配缓存
    this._cache.fuzzyAreaNameMap = {
      prefix: {}, // 前缀匹配
      include: {}  // 包含匹配
    };
    
    // 遍历所有地区名称，构建模糊匹配索引
    for (const [name, code] of this._cache.areaCodeByName.entries()) {
      // 对每个地区名称，创建可能的前缀匹配
      if (name.length > 1) {
        // 只对长度大于1的地区名称构建前缀索引
        for (let i = 1; i <= Math.min(name.length, 3); i++) {
          const prefix = name.substring(0, i);
          if (!this._cache.fuzzyAreaNameMap.prefix[prefix]) {
            this._cache.fuzzyAreaNameMap.prefix[prefix] = [];
          }
          if (!this._cache.fuzzyAreaNameMap.prefix[prefix].includes(code)) {
            this._cache.fuzzyAreaNameMap.prefix[prefix].push(code);
          }
        }
      }
      
      // 对每个地区名称的每个字符，创建包含匹配
      for (let i = 0; i < name.length; i++) {
        const char = name[i];
        if (!this._cache.fuzzyAreaNameMap.include[char]) {
          this._cache.fuzzyAreaNameMap.include[char] = [];
        }
        if (!this._cache.fuzzyAreaNameMap.include[char].includes(code)) {
          this._cache.fuzzyAreaNameMap.include[char].push(code);
        }
      }
    }
  }

  /**
   * 根据年龄计算出生日期
   * @param {number} age 年龄
   * @returns {string} 格式为YYYYMMDD的出生日期
   * @private
   */
  _getBirthdayFromAge(age) {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    
    // 随机生成月份和日期
    const month = this._pad(Math.floor(Math.random() * 12) + 1, 2);
    
    // 根据月份确定天数
    let maxDay = 31;
    if (['04', '06', '09', '11'].includes(month)) {
      maxDay = 30;
    } else if (month === '02') {
      // 处理闰年
      maxDay = this._isLeapYear(birthYear) ? 29 : 28;
    }
    
    const day = this._pad(Math.floor(Math.random() * maxDay) + 1, 2);
    
    return `${birthYear}${month}${day}`;
  }

  /**
   * 判断是否为闰年
   * @param {number} year 年份
   * @returns {boolean} 是否为闰年
   * @private
   */
  _isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * 生成随机出生日期
   * @returns {string} 格式为YYYYMMDD的出生日期
   * @private
   */
  _getRandomBirthday() {
    // 生成1950-2005年之间的随机日期
    const minYear = 1950;
    const maxYear = 2005;
    const year = minYear + Math.floor(Math.random() * (maxYear - minYear + 1));
    
    // 随机月份
    const month = this._pad(Math.floor(Math.random() * 12) + 1, 2);
    
    // 根据月份确定天数
    let maxDay = 31;
    if (['04', '06', '09', '11'].includes(month)) {
      maxDay = 30;
    } else if (month === '02') {
      maxDay = this._isLeapYear(year) ? 29 : 28;
    }
    
    const day = this._pad(Math.floor(Math.random() * maxDay) + 1, 2);
    
    return `${year}${month}${day}`;
  }

  /**
   * 补零函数
   * @param {number} num 需要补零的数字
   * @param {number} length 补零后的长度
   * @returns {string} 补零后的字符串
   * @private
   */
  _pad(num, length) {
    return String(num).padStart(length, '0');
  }

  /**
   * 计算身份证校验码
   * @param {string} idCardBase 身份证前17位
   * @returns {string} 校验码（数字或X）
   * @private
   */
  _calculateCheckCode(idCardBase) {
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCardBase.charAt(i)) * this.ID_WEIGHTS[i];
    }
    
    return this.ID_CHECK_CODES[sum % 11];
  }

  /**
   * 根据地区编码生成匹配的地址
   * @param {string} areaCode 地区编码
   * @returns {string} 地址
   * @private
   */
  _generateAddressByAreaCode(areaCode) {
    this._ensureInitialized();
    
    // 获取地区名称
    const areaName = this._getAreaNameByCode(areaCode);
    
    // 如果没有找到地区名称，使用随机地址
    if (!areaName) {
      return Mock.mock('@province@city@county@cword(2,5)路@natural(1, 1000)号');
    }
    
    // 提取省级编码（前2位）
    const provinceCode = areaCode.substring(0, 2);
    
    // 获取完整的地址层级
    const addressParts = this._getAddressHierarchy(areaCode);
    
    // 生成更详细的地址信息
    const addressDetail = this._generateDetailedAddress();
    
    // 组合地址（去掉中间的空格）
    return `${addressParts.join('')}${addressDetail}`;
  }

  /**
   * 生成详细地址信息（包含小区、单元、门牌等）
   * @returns {string} 详细地址
   * @private
   */
  _generateDetailedAddress() {
    const { communityRatio, streetRatio, buildingRatio } = this.options.addressOptions;
    return addressUtils.generateDetailedAddress(communityRatio, streetRatio, buildingRatio);
  }

  /**
   * 获取地址层级结构
   * @param {string} areaCode 地区编码
   * @returns {Array} 地址层级数组
   * @private
   */
  _getAddressHierarchy(areaCode) {
    // 提取各级编码
    const provinceCode = areaCode.substring(0, 2);
    const cityCode = areaCode.substring(0, 4);
    const districtCode = areaCode.substring(0, 6);
    
    const result = [];
    
    // 判断是否为直辖市
    const isDirectCity = this.DIRECT_CITIES.includes(provinceCode);
    
    // 获取省级名称
    const provinceFullCode = provinceCode + '0000';
    const provinceName = this._getAreaNameByCode(provinceFullCode);
    
    // 获取市级名称
    const cityFullCode = cityCode + '00';
    const cityName = this._getAreaNameByCode(cityFullCode);
    
    // 获取区县名称
    const districtName = this._getAreaNameByCode(districtCode);
    
    // 添加省级名称
    if (provinceName) {
      result.push(provinceName);
    }
    
    // 非直辖市才添加市级名称
    if (!isDirectCity && cityName) {
      // 避免重复添加市级名称（如果省级名称已包含）
      const simpleCityName = cityName.replace(provinceName || '', '');
      if (simpleCityName) {
        result.push(simpleCityName);
      }
    }
    
    // 添加区县名称
    if (districtName) {
      // 避免重复添加区县名称
      let simpleDistrictName = districtName;
      
      if (provinceName) {
        simpleDistrictName = simpleDistrictName.replace(provinceName, '');
      }
      
      if (cityName) {
        const simpleCityName = cityName.replace(provinceName || '', '');
        if (simpleCityName) {
          simpleDistrictName = simpleDistrictName.replace(simpleCityName, '');
        }
      }
      
      if (simpleDistrictName && simpleDistrictName !== '市辖区') {
        result.push(simpleDistrictName);
      }
    }
    
    // 添加乡镇街道级别
    const towns = this._getTownsByAreaCode(districtCode);
    if (towns && towns.length > 0) {
      // 随机选择一个乡镇街道
      const randomTown = towns[Math.floor(Math.random() * towns.length)];
      if (randomTown && randomTown.name) {
        result.push(randomTown.name);
      }
    }
    
    return result;
  }

  /**
   * 生成小区名称（已迁移到address.js，保留此方法以兼容）
   * @returns {string} 小区名称
   * @private
   */
  _generateCommunityName() {
    return addressUtils.generateCommunityName();
  }

  /**
   * 生成商业建筑名称（已迁移到address.js，保留此方法以兼容）
   * @returns {string} 商业建筑名称
   * @private
   */
  _generateBuildingName() {
    return addressUtils.generateBuildingName();
  }

  /**
   * 生成邮箱地址
   * @param {string} name 姓名
   * @returns {string} 邮箱地址
   * @private
   */
  _generateEmail(name) {
    // 使用拼音工具将姓名转换为拼音
    const prefix = pinyinUtils.nameToEmailPrefix(name);
    
    // 如果转换失败，使用随机字符串
    const emailPrefix = prefix || Mock.Random.word(3, 10);
    
    // 随机选择一个邮箱域名
    const domain = this.EMAIL_DOMAINS[Math.floor(Math.random() * this.EMAIL_DOMAINS.length)];
    
    // 组合成邮箱地址
    return `${emailPrefix}${Math.floor(Math.random() * 1000)}@${domain}`;
  }
}

module.exports = ChineseIdGenerator;
