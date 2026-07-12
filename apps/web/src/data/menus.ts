export type MenuItem = {
  name: string
  price: string
  spec?: string
}

export type MenuCategory = {
  name: string
  items: MenuItem[]
}

export type StoreMenu = {
  name: string
  updatedAt: string
  categories: MenuCategory[]
  note?: string
  /** 为 true 时不在页面展示，数据仍保留 */
  hidden?: boolean
}

export type SortMode = 'default' | 'priceAsc' | 'priceDesc'

export const ALL_STORES = '全部店铺'
export const LOW_PRICE_LIMIT = 20
const UPDATED_FROM_BBM = '2026-03-18 09:00'
const UPDATED_FROM_XBMY = '2026-03-04 17:50'
const UPDATED_FROM_MENU = '2026-03-02 15:13'
const UPDATED_FROM_WANJI = '2026-03-02 15:10'
const UPDATED_FROM_YCA = '2026-04-01 12:00'
const UPDATED_FROM_YBD = '2026-04-27 12:00'

const allMenuData: StoreMenu[] = [
  {
    name: '西北面宴',
    updatedAt: UPDATED_FROM_XBMY,
    categories: [
      {
        name: '招牌汤面',
        items: [
          { name: '招牌骨汤牛肉面', price: '¥14' },
          { name: '香辣骨汤牛肉面', price: '¥16' },
          { name: '酸菜骨汤牛肉面', price: '¥16' },
          { name: '西红柿鸡蛋汤面', price: '¥16' },
        ],
      },
      {
        name: '招牌套餐',
        items: [
          { name: '单人套餐', spec: '面+牛肉+甜胚子/酸奶+小菜', price: '¥30' },
          { name: '肉蛋双飞单人餐', spec: '面+牛肉+卤蛋', price: '¥23' },
          { name: '双人套餐', spec: '2面+2牛肉+2甜品+2小菜', price: '¥60' },
        ],
      },
      {
        name: '招牌炒面',
        items: [
          { name: '经典牛肉炒面', price: '¥20' },
          { name: '经典鸡蛋炒面', price: '¥18' },
        ],
      },
      {
        name: '现炒浇头面',
        items: [
          { name: '土豆炒肉浇头面', price: '¥20' },
          { name: '番茄炒蛋浇头面', price: '¥18' },
          { name: '辣椒炒肉浇头面', price: '¥20' },
          { name: '红烧鸡块浇头面', price: '¥20' },
        ],
      },
      {
        name: '饭类',
        items: [
          { name: '蛋炒饭', price: '¥12' },
          { name: '兰州炒饭', price: '¥16' },
          { name: '新疆抓饭', price: '¥18' },
          { name: '土豆牛肉盖浇饭', price: '¥20' },
          { name: '青椒炒肉盖浇饭', price: '¥20' },
          { name: '孜然牛肉盖浇饭', price: '¥20' },
          { name: '葱爆牛肉盖浇饭', price: '¥20' },
          { name: '红烧鸡块盖浇饭', price: '¥20' },
        ],
      },
      {
        name: '招牌小吃',
        items: [
          { name: '牛肉肉夹馍', price: '¥10' },
          { name: '燕麦甜胚子', price: '¥6' },
          { name: '冰淇淋酸奶', price: '¥6' },
          { name: '卤鸡蛋', price: '¥2' },
          { name: '现切酱牛肉', price: '¥12' },
          { name: '凉拌牛肉', price: '大¥40 / 小¥25' },
          { name: '烤面筋', price: '¥3' },
          { name: '烤鸡翅', price: '¥10' },
          { name: '小菜', price: '¥5' },
          { name: '烤包子', price: '¥7' },
          { name: '烤羊肉串', price: '¥6' },
        ],
      },
    ],
  },
  {
    name: '蜜汁叉烧饭',
    updatedAt: UPDATED_FROM_MENU,
    categories: [
      {
        name: '招牌饭类',
        items: [
          { name: '蜜汁叉烧饭', price: '18元' },
          { name: '脆皮烤鸭饭', price: '16元' },
          { name: '鸭腿饭', price: '14元' },
          { name: '红烧肉饭', price: '16元' },
          { name: '鸡扒饭', price: '14元' },
          { name: '广式腊肠饭', price: '13元' },
          { name: '奥尔良烤腿饭', price: '15元' },
          { name: '叉烧拼腊肠饭', price: '15元' },
          { name: '叉烧拼烤鸭饭', price: '18元' },
          { name: '叉烧拼鸡扒饭', price: '17元' },
          { name: '叉烧拼鸭腿饭', price: '18元' },
          { name: '叉烧拼烧腿饭', price: '19元' },
        ],
      },
    ],
  },
  {
    name: '贵州粉面',
    updatedAt: UPDATED_FROM_MENU,
    categories: [
      {
        name: '酸辣粉类',
        items: [
          { name: '酸辣粉', price: '10元' },
          { name: '肉沫酸辣粉', price: '15元' },
          { name: '辣鸡酸辣粉', price: '15元' },
          { name: '泡椒鸡杂酸辣粉', price: '15元' },
          { name: '牛肉酸辣粉', price: '18元' },
          { name: '肥肠酸辣粉', price: '18元' },
        ],
      },
      {
        name: '贵州粉面类',
        items: [
          { name: '素粉(面)', price: '10元' },
          { name: '辣鸡粉(面)', price: '15元' },
          { name: '肉沫粉(面)', price: '15元' },
          { name: '泡椒鸡杂粉(面)', price: '15元' },
          { name: '酸菜肉丝粉(面)', price: '15元' },
          { name: '青椒肉沫粉(面)', price: '15元' },
          { name: '肠旺粉(面)', price: '18元' },
          { name: '牛肉粉(面)', price: '18元' },
        ],
      },
      {
        name: '夏季供应',
        items: [
          { name: '凉面', price: '10元' },
          { name: '凉粉', price: '10元' },
          { name: '凉剪粉', price: '10元' },
          { name: '煎蛋', price: '2元' },
        ],
      },
      {
        name: '抄手类',
        items: [{ name: '抄手', price: '15元' }],
      },
    ],
  },
  {
    name: '飞叔生炸',
    updatedAt: UPDATED_FROM_MENU,
    hidden: true,
    note: '口味可选：甘梅、微辣、蒜香、中辣、麻辣、特辣；鸡架另有焦糖、咸香。',
    categories: [
      {
        name: '桶装系列',
        items: [
          { name: '3合1鸡柳桶', price: '中¥13 / 大¥16 / 超大¥19' },
          { name: '招牌鸡架', price: '中¥13 / 大¥16' },
        ],
      },
      {
        name: '招牌必点',
        items: [
          { name: '焦嫩鸡腿肉', price: '16元/份' },
          { name: '弹牙鸡胗', price: '16元/份' },
          { name: '龙骨鸡块', price: '13元/份' },
        ],
      },
      {
        name: '美味肉食',
        items: [
          { name: '香酥鸡柳', price: '13元/份' },
          { name: '藤椒翅尖', price: '10元/份' },
          { name: '裹粉杏鲍菇', price: '10元/份' },
        ],
      },
      {
        name: '超值性价比',
        items: [
          { name: '甘梅地瓜', price: '10元/份' },
          { name: '香脆薯条', price: '8元/份' },
          { name: '空气年糕', price: '6元/份' },
        ],
      },
      {
        name: '经典小吃',
        items: [
          { name: '生炸大鸡腿', price: '7元/份' },
          { name: '香嫩大里脊', price: '3元/个' },
          { name: '开花大香肠', price: '3元/根' },
          { name: '酒酿饼', price: '3元/个' },
        ],
      },
    ],
  },
  {
    name: '万记衢味融合菜',
    updatedAt: UPDATED_FROM_WANJI,
    categories: [
      {
        name: '热菜 / 炒菜类',
        items: [
          { name: '秘制羊排', price: '¥98.00' },
          { name: '紫苏鱼头豆腐', price: '¥88.00' },
          { name: '衢味花椒鸡', price: '¥68.00' },
          { name: '红烧带鱼', price: '¥68.00' },
          { name: '鹅掌炖猪脚', price: '¥68.00' },
          { name: '小炒黄牛肉', price: '¥48.00' },
          { name: '辣炒三样', price: '¥48.00' },
          { name: '衢味酥肉卷', price: '¥48.00' },
          { name: '麻辣鲜贝', price: '¥48.00' },
          { name: '温州鱼丸', price: '¥38.00' },
          { name: '小炒鹿茸菇', price: '¥38.00' },
          { name: '椒盐海龙鱼', price: '¥38.00' },
          { name: '菜心牡蛎煎', price: '¥38.00' },
          { name: '白辣椒炒肉', price: '¥36.00' },
          { name: '季节小炒', price: '¥32.00' },
          { name: '石锅海胆豆腐', price: '¥32.00' },
          { name: '酸菜炖粉条', price: '¥28.00' },
          { name: '香酥虾酱骨', price: '¥26.00' },
          { name: '干锅脆笋丝', price: '¥26.00' },
          { name: '老家香干', price: '¥22.00' },
          { name: '干锅土豆片', price: '¥18.00' },
          { name: '外婆菜炒蛋', price: '¥16.00' },
          { name: '蒜泥茼蒿', price: '¥16.00' },
          { name: '葱油广东菜心', price: '¥16.00' },
        ],
      },
      {
        name: '凉菜类',
        items: [
          { name: '拌黄瓜', price: '¥10.00' },
          { name: '拌海带丝', price: '¥10.00' },
          { name: '花生米', price: '¥8.00' },
        ],
      },
      {
        name: '特色面食与汤粥',
        items: [
          { name: '蛏子烧豆面', price: '¥48.00' },
          { name: '片儿川', price: '¥16.00' },
          { name: '胡辣汤', price: '¥5.00' },
          { name: '小米粥', price: '¥3.00' },
        ],
      },
      {
        name: '手工水饺',
        items: [
          { name: '韭菜鲜肉水饺', spec: '大份 (20个)', price: '¥22.00' },
          { name: '韭菜鲜肉水饺', spec: '小份 (15个)', price: '¥16.00' },
          { name: '玉米鲜肉水饺', spec: '大份 (20个)', price: '¥22.00' },
          { name: '玉米鲜肉水饺', spec: '小份 (15个)', price: '¥16.00' },
          { name: '酸菜鲜肉水饺', spec: '大份 (20个)', price: '¥22.00' },
          { name: '酸菜鲜肉水饺', spec: '小份 (15个)', price: '¥16.00' },
          { name: '芹菜鲜肉水饺', spec: '大份 (20个)', price: '¥22.00' },
          { name: '芹菜鲜肉水饺', spec: '小份 (15个)', price: '¥16.00' },
        ],
      },
      {
        name: '饼类',
        items: [
          { name: '麦饼桶', price: '¥10.00' },
          { name: '鲜肉京葱千层饼', price: '¥8.00' },
          { name: '绸缎大饼+凉菜', price: '¥8.00' },
          { name: '牛肉烧饼', price: '¥7.00' },
          { name: '年糕饼子', price: '¥5.00' },
          { name: '烧饼', price: '¥5.00' },
        ],
      },
    ],
  },
  {
    name: '芭比馒头',
    updatedAt: UPDATED_FROM_BBM,
    note: '菜单按店内照片录入，实际供应与价格以门店当日为准。',
    categories: [
      {
        name: '肉多多鲜包',
        items: [
          { name: '鲜汁肉包', price: '¥2.5' },
          { name: '奥尔良肉包', price: '¥2.5' },
          { name: '梅干菜肉包', price: '¥2.5' },
          { name: '鱼香肉丝包', price: '¥2.5' },
          { name: '冬笋酱肉包', price: '¥2.5' },
          { name: '麻辣虾仁包', price: '¥3.5' },
          { name: '香辣牛肉包', price: '¥4.0' },
        ],
      },
      {
        name: '菜多多鲜包',
        items: [
          { name: '香菇菜包', price: '¥2.0' },
          { name: '香辣粉丝包', price: '¥2.0' },
          { name: '香菇豆腐包', price: '¥2.0' },
          { name: '酸豆角肉包', price: '¥2.0' },
          { name: '酸辣土豆丝包', price: '¥2.0' },
          { name: '老坛酸菜包', price: '¥2.0' },
        ],
      },
      {
        name: '甜多多鲜包',
        items: [
          { name: '豆沙包', price: '¥2.0' },
          { name: '小兔紫薯包', price: '¥2.0' },
          { name: '小猪奶黄包', price: '¥2.0' },
          { name: '黑芝麻包', price: '¥2.0' },
          { name: '爆汁流沙包', price: '¥3.0' },
          { name: '南瓜热狗卷', price: '¥3.5' },
        ],
      },
      {
        name: '小笼包 / 煎包',
        items: [
          { name: '老面鲜肉小笼包', price: '¥8.0' },
          { name: '上海肉小笼包', price: '¥9.0' },
          { name: '鲜肉荠菜饺', price: '¥7.0' },
          { name: '红油牛肉饺', price: '¥8.0' },
          { name: '牛肉煎包', spec: '1只', price: '¥3.0' },
        ],
      },
      {
        name: '饮品粥品',
        items: [
          { name: '经典豆浆', price: '¥3.0' },
          { name: '红豆豆浆', price: '¥3.5' },
        ],
      },
      {
        name: '现熬汤粥',
        items: [
          { name: '现熬白粥', price: '¥3.0' },
          { name: '辣糊汤', price: '¥4.0' },
          { name: '现熬南瓜粥', price: '¥4.0' },
          { name: '血糯桂圆粥', price: '¥4.0' },
          { name: '皮蛋瘦肉粥', price: '¥5.0' },
        ],
      },
      {
        name: '馒头、粗粮',
        items: [
          { name: '刀切馒头', price: '¥1.0' },
          { name: '葱油花卷', price: '¥1.0' },
          { name: '红糖馒头', price: '¥2.0' },
          { name: '玉米馒头', price: '¥2.0' },
          { name: '坚果馒头', price: '¥2.0' },
          { name: '南瓜红豆卷', price: '¥2.0' },
        ],
      },
      {
        name: '米多多烧卖、米糕',
        items: [
          { name: '鲜肉大烧卖', price: '¥2.5' },
          { name: '蛋黄烧卖', price: '¥3.0' },
          { name: '黑米糕', price: '¥2.0' },
          { name: '港式马拉糕', price: '¥3.0' },
          { name: '水塔糕', price: '¥3.0' },
          { name: '鲜肉粽', price: '¥6.0' },
          { name: '蛋黄鲜肉粽', price: '¥7.0' },
          { name: '咸蛋黄饭团', price: '¥6.5' },
        ],
      },
      {
        name: '特色馅饼',
        items: [
          { name: '招牌牛肉馅饼', price: '¥5.5' },
          { name: '猪肉大葱馅饼', price: '¥4.0' },
          { name: '奥尔良鸡肉馅饼', price: '¥4.0' },
          { name: '甜糯玉米', price: '¥5.0' },
          { name: '葱油饼', price: '¥3.0' },
        ],
      },
    ],
  },
  {
    name: '悦长安',
    updatedAt: UPDATED_FROM_YCA,
    note: '菜单含内部价与对外价，此处显示内部原价，现实际支付六折；套餐为实收价。',
    categories: [
      {
        name: '陕面 / 广点',
        items: [
          { name: '鲜肉酥饼', price: '¥42' },
          { name: '虾爆鳝面', price: '¥78' },
          { name: '片儿川', price: '¥36' },
          { name: '酒酿丸子', price: '¥32' },
          { name: '酥皮菠萝包', price: '¥15' },
          { name: '榴莲酥', price: '¥38' },
          { name: '开胃酸奶糕', price: '¥28' },
          { name: '百香果布丁', price: '¥28' },
          { name: '香煎韭菜饺', price: '¥28' },
          { name: '水晶虾饺皇', price: '¥38' },
          { name: '和牛鸡蛋挞', price: '¥38' },
          { name: '杨枝甘露', price: '¥22' },
          { name: '腊汁肉夹馍', price: '¥13' },
          { name: '羊肉泡馍', price: '¥25' },
          { name: '葫芦头泡馍', price: '¥40' },
          { name: '臊子面', price: '¥25' },
          { name: '油泼面（宽面）', price: '¥22' },
          { name: '蘸水面', price: '¥30' },
          { name: 'biangbiang面', price: '¥30' },
          { name: '荞面饸饹', spec: '羊肉臊子', price: '¥35' },
          { name: '陕北蒸花饼', price: '¥22' },
        ],
      },
      {
        name: '陕西菜',
        items: [
          { name: '葫芦鸡', price: '¥110' },
          { name: '老陕烧三鲜', price: '¥60' },
          { name: '紫阳蒸盆子', price: '¥248' },
          { name: '脆皮茄子', price: '¥35' },
          { name: '横山炖羊肉', price: '¥300' },
          { name: '海参烀蹄子', price: '¥158' },
          { name: '油泼老豆腐', price: '¥25' },
          { name: '糖醋鱿鱼卷', price: '¥98' },
          { name: '商芝肉', price: '¥88' },
          { name: '猴带棒', price: '¥68' },
          { name: '金缕团鱼', price: '¥155' },
          { name: '西府臊子排骨', price: '¥88' },
          { name: '奶汤锅子盘', price: '¥100' },
        ],
      },
      {
        name: '浙江菜',
        items: [
          { name: '雪菜炒冬笋', price: '¥48' },
          { name: '东坡肉', price: '¥85' },
          { name: '西湖醋鱼', price: '¥88' },
          { name: '荷塘小炒', price: '¥48' },
          { name: '龙井虾仁', price: '¥118' },
          { name: '雪菜大汤黄鱼', price: '¥128' },
          { name: '冰糖甲鱼', price: '¥138' },
          { name: '锅烧鳗', price: '¥128' },
          { name: '鳝鱼年糕', price: '¥128' },
          { name: '里叶莲子鸡', price: '¥128' },
          { name: '蟹粉豆腐', price: '¥58' },
          { name: '杭三鲜', price: '¥98' },
          { name: '老鸭煲', price: '¥128' },
          { name: '莼菜汤', price: '¥58' },
          { name: '松茸炖土鸡', price: '¥88' },
          { name: '西湖牛肉羹', price: '¥68' },
          { name: '山药排骨汤', price: '¥78' },
        ],
      },
      {
        name: '套餐',
        items: [
          { name: '两人A套餐', spec: '关中小炒肉/杭椒小炒肉/炒时蔬/米饭/小米粥', price: '¥38' },
          { name: '两人B套餐', spec: '啤酒笋干鸭/肉沫粉丝蒸水蛋/炒时蔬/米饭/小米粥', price: '¥38' },
          { name: '3-4人A套餐', spec: '三秦凉皮(凉)/笋干炒肉/香菇蒸滑鸡/家常烧豆腐/炒时蔬/米饭/小米粥', price: '¥68' },
          { name: '3-4人B套餐', spec: '香蚕酱汁萝卜/红烧鱼块/榨菜蒸花腩/荞头煎土鸡蛋/炒时蔬/米饭/小米粥', price: '¥68' },
        ],
      },
    ],
  },
  {
    name: '咬不得生煎',
    updatedAt: UPDATED_FROM_YBD,
    categories: [
      {
        name: '招牌生煎',
        items: [
          { name: '招牌鲜肉生煎', spec: '4只', price: '¥10' },
          { name: '招牌虾仁生煎', spec: '4只', price: '¥12' },
          { name: '招牌生煎双拼', spec: '4只', price: '¥11' },
        ],
      },
      {
        name: '特色汤羹',
        items: [
          { name: '鸭血粉丝汤', price: '¥13' },
          { name: '牛肉粉丝汤', price: '¥13' },
          { name: '皮蛋瘦肉粥', price: '¥8' },
          { name: '红枣南瓜粥', price: '¥8' },
          { name: '东阳沃豆腐', price: '¥12' },
          { name: '酱鸭菜泡饭', price: '¥12' },
          { name: '嵊州豆腐汤年糕', price: '¥17' },
        ],
      },
      {
        name: '特色小菜',
        items: [
          { name: '荷包蛋', price: '¥2' },
          { name: '肉沫水蒸蛋', price: '¥5' },
          { name: '金牌卤汁大排', price: '¥15' },
        ],
      },
      {
        name: '地道粉面',
        items: [
          { name: '老坛酸菜牛肉面/粉', price: '¥31' },
          { name: '杭式片儿川', price: '¥16' },
          { name: '大排面/粉', price: '¥22' },
          { name: '家常卤肉拌面/粉', price: '¥21' },
          { name: '京都炸酱面/粉', price: '¥18' },
        ],
      },
      {
        name: '人气套餐',
        items: [
          { name: '牛肉/鸭血粉丝汤生煎双拼', price: '¥22' },
          { name: '黄焖牛腩饭+水蒸蛋套餐', price: '¥35' },
        ],
      },
      {
        name: '营养饭食',
        items: [
          { name: '黄焖牛腩饭', price: '¥31' },
          { name: '家常卤肉饭', price: '¥25' },
          { name: '孜然牛肉炒饭', price: '¥18' },
          { name: '扬州炒饭', price: '¥15' },
        ],
      },
      {
        name: '小菜&饮品',
        items: [
          { name: '甜豆浆', price: '¥3' },
          { name: '古法酸梅汤', price: '¥3' },
          { name: '红豆汤', price: '¥5' },
        ],
      },
    ],
  },
]

/** 页面展示用（已过滤 hidden） */
export const menuData: StoreMenu[] = allMenuData.filter((s) => !s.hidden)
