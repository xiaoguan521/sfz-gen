/**
 * 拼音转换工具
 * 提供汉字转拼音的功能
 */

// 常用汉字拼音映射表（简化版）
const PINYIN_MAP = {
  '阿': 'a', '啊': 'a', '爱': 'ai', '安': 'an', '昂': 'ang', '奥': 'ao',
  '八': 'ba', '白': 'bai', '百': 'bai', '班': 'ban', '办': 'ban', '半': 'ban', '邦': 'bang', '包': 'bao', '北': 'bei', '本': 'ben', '必': 'bi', '边': 'bian', '别': 'bie', '病': 'bing', '波': 'bo', '不': 'bu',
  '才': 'cai', '菜': 'cai', '参': 'can', '草': 'cao', '测': 'ce', '曾': 'ceng', '查': 'cha', '产': 'chan', '常': 'chang', '超': 'chao', '车': 'che', '成': 'cheng', '城': 'cheng', '吃': 'chi', '出': 'chu', '川': 'chuan', '传': 'chuan', '春': 'chun', '次': 'ci', '从': 'cong', '村': 'cun',
  '大': 'da', '代': 'dai', '单': 'dan', '但': 'dan', '当': 'dang', '到': 'dao', '道': 'dao', '的': 'de', '得': 'de', '等': 'deng', '地': 'di', '第': 'di', '点': 'dian', '电': 'dian', '东': 'dong', '动': 'dong', '都': 'dou', '读': 'du', '度': 'du', '段': 'duan', '对': 'dui', '多': 'duo',
  '儿': 'er', '而': 'er',
  '发': 'fa', '法': 'fa', '反': 'fan', '方': 'fang', '房': 'fang', '放': 'fang', '非': 'fei', '分': 'fen', '风': 'feng', '佛': 'fo', '否': 'fou', '夫': 'fu', '服': 'fu', '父': 'fu', '付': 'fu',
  '该': 'gai', '改': 'gai', '干': 'gan', '刚': 'gang', '高': 'gao', '告': 'gao', '革': 'ge', '格': 'ge', '个': 'ge', '给': 'gei', '跟': 'gen', '更': 'geng', '工': 'gong', '共': 'gong', '够': 'gou', '古': 'gu', '故': 'gu', '关': 'guan', '观': 'guan', '光': 'guang', '广': 'guang', '规': 'gui', '国': 'guo', '果': 'guo',
  '还': 'hai', '海': 'hai', '含': 'han', '汉': 'han', '好': 'hao', '号': 'hao', '和': 'he', '河': 'he', '黑': 'hei', '很': 'hen', '红': 'hong', '后': 'hou', '候': 'hou', '湖': 'hu', '花': 'hua', '化': 'hua', '话': 'hua', '怀': 'huai', '环': 'huan', '黄': 'huang', '回': 'hui', '会': 'hui', '活': 'huo',
  '几': 'ji', '己': 'ji', '机': 'ji', '基': 'ji', '吉': 'ji', '极': 'ji', '及': 'ji', '即': 'ji', '集': 'ji', '计': 'ji', '记': 'ji', '家': 'jia', '加': 'jia', '间': 'jian', '见': 'jian', '江': 'jiang', '将': 'jiang', '教': 'jiao', '接': 'jie', '今': 'jin', '近': 'jin', '进': 'jin', '经': 'jing', '京': 'jing', '九': 'jiu', '久': 'jiu', '就': 'jiu', '居': 'ju', '局': 'ju', '决': 'jue',
  '开': 'kai', '看': 'kan', '考': 'kao', '科': 'ke', '可': 'ke', '克': 'ke', '空': 'kong', '口': 'kou', '苦': 'ku', '快': 'kuai', '宽': 'kuan', '况': 'kuang', '困': 'kun', '扩': 'kuo',
  '来': 'lai', '蓝': 'lan', '老': 'lao', '了': 'le', '类': 'lei', '里': 'li', '理': 'li', '力': 'li', '立': 'li', '利': 'li', '历': 'li', '丽': 'li', '连': 'lian', '两': 'liang', '料': 'liao', '林': 'lin', '临': 'lin', '灵': 'ling', '领': 'ling', '六': 'liu', '流': 'liu', '龙': 'long', '楼': 'lou', '路': 'lu', '录': 'lu', '陆': 'lu', '乱': 'luan', '论': 'lun', '落': 'luo',
  '马': 'ma', '吗': 'ma', '买': 'mai', '卖': 'mai', '满': 'man', '毛': 'mao', '没': 'mei', '美': 'mei', '门': 'men', '们': 'men', '梦': 'meng', '米': 'mi', '面': 'mian', '民': 'min', '明': 'ming', '命': 'ming', '模': 'mo', '某': 'mou', '目': 'mu',
  '那': 'na', '南': 'nan', '难': 'nan', '脑': 'nao', '内': 'nei', '能': 'neng', '你': 'ni', '年': 'nian', '念': 'nian', '您': 'nin', '牛': 'niu', '农': 'nong', '女': 'nv',
  '偶': 'ou',
  '怕': 'pa', '拍': 'pai', '排': 'pai', '盘': 'pan', '旁': 'pang', '跑': 'pao', '朋': 'peng', '片': 'pian', '品': 'pin', '平': 'ping', '评': 'ping', '破': 'po', '普': 'pu',
  '其': 'qi', '起': 'qi', '气': 'qi', '汽': 'qi', '前': 'qian', '钱': 'qian', '强': 'qiang', '桥': 'qiao', '且': 'qie', '亲': 'qin', '轻': 'qing', '请': 'qing', '秋': 'qiu', '区': 'qu', '取': 'qu', '去': 'qu', '全': 'quan', '缺': 'que',
  '然': 'ran', '让': 'rang', '热': 're', '人': 'ren', '认': 'ren', '任': 'ren', '日': 'ri', '容': 'rong', '如': 'ru', '入': 'ru',
  '三': 'san', '色': 'se', '森': 'sen', '杀': 'sha', '山': 'shan', '上': 'shang', '少': 'shao', '社': 'she', '身': 'shen', '深': 'shen', '什': 'shen', '生': 'sheng', '声': 'sheng', '省': 'sheng', '师': 'shi', '十': 'shi', '时': 'shi', '识': 'shi', '实': 'shi', '始': 'shi', '世': 'shi', '是': 'shi', '事': 'shi', '市': 'shi', '收': 'shou', '手': 'shou', '受': 'shou', '书': 'shu', '术': 'shu', '数': 'shu', '水': 'shui', '说': 'shuo', '思': 'si', '四': 'si', '送': 'song', '诉': 'su', '算': 'suan', '随': 'sui', '岁': 'sui', '所': 'suo',
  '他': 'ta', '她': 'ta', '台': 'tai', '太': 'tai', '谈': 'tan', '探': 'tan', '唐': 'tang', '堂': 'tang', '套': 'tao', '特': 'te', '提': 'ti', '题': 'ti', '体': 'ti', '天': 'tian', '条': 'tiao', '听': 'ting', '同': 'tong', '头': 'tou', '图': 'tu', '土': 'tu', '团': 'tuan', '推': 'tui',
  '外': 'wai', '完': 'wan', '万': 'wan', '王': 'wang', '网': 'wang', '为': 'wei', '卫': 'wei', '未': 'wei', '位': 'wei', '文': 'wen', '问': 'wen', '我': 'wo', '无': 'wu', '五': 'wu', '物': 'wu',
  '西': 'xi', '息': 'xi', '希': 'xi', '系': 'xi', '下': 'xia', '先': 'xian', '现': 'xian', '县': 'xian', '向': 'xiang', '像': 'xiang', '小': 'xiao', '校': 'xiao', '些': 'xie', '写': 'xie', '谢': 'xie', '心': 'xin', '新': 'xin', '信': 'xin', '星': 'xing', '行': 'xing', '性': 'xing', '兴': 'xing', '修': 'xiu', '许': 'xu', '需': 'xu', '选': 'xuan', '学': 'xue',
  '亚': 'ya', '言': 'yan', '研': 'yan', '验': 'yan', '央': 'yang', '样': 'yang', '要': 'yao', '也': 'ye', '业': 'ye', '一': 'yi', '以': 'yi', '亿': 'yi', '意': 'yi', '艺': 'yi', '易': 'yi', '因': 'yin', '音': 'yin', '印': 'yin', '应': 'ying', '英': 'ying', '影': 'ying', '用': 'yong', '优': 'you', '有': 'you', '又': 'you', '于': 'yu', '与': 'yu', '语': 'yu', '育': 'yu', '预': 'yu', '元': 'yuan', '原': 'yuan', '远': 'yuan', '院': 'yuan', '约': 'yue', '越': 'yue', '云': 'yun', '运': 'yun',
  '杂': 'za', '在': 'zai', '咱': 'zan', '早': 'zao', '造': 'zao', '则': 'ze', '怎': 'zen', '增': 'zeng', '展': 'zhan', '张': 'zhang', '章': 'zhang', '找': 'zhao', '着': 'zhe', '真': 'zhen', '正': 'zheng', '政': 'zheng', '之': 'zhi', '知': 'zhi', '直': 'zhi', '指': 'zhi', '至': 'zhi', '制': 'zhi', '中': 'zhong', '种': 'zhong', '重': 'zhong', '周': 'zhou', '州': 'zhou', '主': 'zhu', '住': 'zhu', '助': 'zhu', '注': 'zhu', '专': 'zhuan', '转': 'zhuan', '装': 'zhuang', '准': 'zhun', '资': 'zi', '子': 'zi', '自': 'zi', '总': 'zong', '走': 'zou', '组': 'zu', '最': 'zui', '作': 'zuo'
};

/**
 * 将汉字转换为拼音
 * @param {string} chinese 中文字符串
 * @param {boolean} firstLetterOnly 是否只返回首字母，默认为false
 * @returns {string} 拼音字符串
 */
function toPinyin(chinese, firstLetterOnly = false) {
  if (!chinese || typeof chinese !== 'string') {
    return '';
  }
  
  let result = '';
  
  for (let i = 0; i < chinese.length; i++) {
    const char = chinese.charAt(i);
    
    // 如果是汉字，尝试转换为拼音
    if (/[\u4e00-\u9fa5]/.test(char)) {
      const pinyin = PINYIN_MAP[char] || 'x'; // 默认为x
      result += firstLetterOnly ? pinyin.charAt(0) : pinyin;
    } else {
      // 非汉字字符保持不变
      result += char;
    }
  }
  
  return result;
}

/**
 * 将中文名转换为拼音，适合生成邮箱前缀
 * @param {string} name 中文姓名
 * @returns {string} 拼音形式的姓名，如"张三"转为"zhangsan"
 */
function nameToEmailPrefix(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // 移除非中文字符
  const chineseName = name.replace(/[^\u4e00-\u9fa5]/g, '');
  
  // 转换为拼音
  return toPinyin(chineseName).toLowerCase();
}

module.exports = {
  toPinyin,
  nameToEmailPrefix
}; 