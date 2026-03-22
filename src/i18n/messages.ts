export type Locale = 'zh-CN' | 'en-US' | 'ja-JP'

export const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
]

const itemMessages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    item_carbon_powder: '碳粉',
    item_carbon_enr_powder: '富碳粉',
    item_carbon_enr: '富碳材料',
    item_carbon_mtl: '碳材料',
    item_plant_grass_2: '草',
    item_plant_grass_seed_2: '草种子',
    item_plant_moss_3: '苔藓',
    item_plant_moss_powder_3: '苔藓粉',
    item_liquid_water: '水',
    item_proc_battery_3: '三级电池',
    item_proc_battery_5: '五级电池',
    item_xiranite_powder: '源晶粉末',
  },
  'en-US': {
    item_carbon_powder: 'Carbon Powder',
    item_carbon_enr_powder: 'Enriched Carbon Powder',
    item_carbon_enr: 'Enriched Carbon',
    item_carbon_mtl: 'Carbon Material',
    item_plant_grass_2: 'Grass',
    item_plant_grass_seed_2: 'Grass Seed',
    item_plant_moss_3: 'Moss',
    item_plant_moss_powder_3: 'Moss Powder',
    item_liquid_water: 'Water',
    item_proc_battery_3: 'Battery Mk.3',
    item_proc_battery_5: 'Battery Mk.5',
    item_xiranite_powder: 'Xiranite Powder',
  },
  'ja-JP': {
    item_carbon_powder: 'カーボンパウダー',
    item_carbon_enr_powder: '富化カーボンパウダー',
    item_carbon_enr: '富化カーボン',
    item_carbon_mtl: 'カーボン素材',
    item_plant_grass_2: '草',
    item_plant_grass_seed_2: '草の種',
    item_plant_moss_3: '苔',
    item_plant_moss_powder_3: '苔のパウダー',
    item_liquid_water: '水',
    item_proc_battery_3: 'バッテリー Mk.3',
    item_proc_battery_5: 'バッテリー Mk.5',
    item_xiranite_powder: '源晶パウダー',
  },
}

const buildingMessages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    power_station_1: '热电池',
    power_diffuser_1: '供电桩',
    grid_belt_01: '传送带',
    unloader_1: '仓库取货口',
    furnance_1: '精炼炉',
    grinder_1: '粉碎机',
    thickener_1: '研磨机',
    xiranite_oven_1: '天有烘炉',
    planter_1: '种植机',
    seedcollector_1: '采种机',
    storager_1: '协议储存箱',
    shaper_1: '塑形机',
    log_connector: '物流桥',
    log_pipe_01: '管道',
    log_pipe_splitter: '管道分流器',
    log_pipe_conditioner: '管道汇流器',
    log_conditioner: '物品准入口',
    log_splitter: '分流器',
    log_hongs_bus: '物流总线',
    log_hongs_bus_source: '物品准入口',
    unknown: '未知建筑',
  },
  'en-US': {
    power_station_1: 'Thermal Battery',
    power_diffuser_1: 'Power Post',
    grid_belt_01: 'Conveyor Belt',
    unloader_1: 'Storage Unloader',
    furnance_1: 'Refining Furnace',
    grinder_1: 'Crusher',
    thickener_1: 'Grinder',
    xiranite_oven_1: 'Sky Furnace',
    planter_1: 'Planter',
    seedcollector_1: 'Seed Collector',
    storager_1: 'Storage Box',
    shaper_1: 'Shaper',
    log_connector: 'Logistics Bridge',
    log_pipe_01: 'Pipe',
    log_pipe_splitter: 'Pipe Splitter',
    log_pipe_conditioner: 'Pipe Conditioner',
    log_conditioner: 'Item Input Port',
    log_splitter: 'Splitter',
    log_hongs_bus: 'Logistics Bus',
    log_hongs_bus_source: 'Item Input Port',
    unknown: 'Unknown Building',
  },
  'ja-JP': {
    power_station_1: '熱電池',
    power_diffuser_1: '給電ポースト',
    grid_belt_01: 'コンベアベルト',
    unloader_1: '倉庫出品口',
    furnance_1: '精錬炉',
    grinder_1: '粉砕機',
    thickener_1: 'グラインダー',
    xiranite_oven_1: '天有烘炉',
    planter_1: '植栽機',
    seedcollector_1: '採種機',
    storager_1: '協約貯蔵箱',
    shaper_1: '塑形機',
    log_connector: '物流ブリッジ',
    log_pipe_01: 'パイプ',
    log_pipe_splitter: 'パイプ分流器',
    log_pipe_conditioner: 'パイプ汇流器',
    log_conditioner: '物品準入口',
    log_splitter: '分流器',
    log_hongs_bus: '物流バス',
    log_hongs_bus_source: '物品準入口',
    unknown: '不明な建物',
  },
}

const payloadTypeMessages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    formula_man: '配方',
    selector: '选择器',
    fluid_valve: '流体阀',
    unknown: '未知',
  },
  'en-US': {
    formula_man: 'Formula',
    selector: 'Selector',
    fluid_valve: 'Fluid Valve',
    unknown: 'Unknown',
  },
  'ja-JP': {
    formula_man: 'レシピ',
    selector: 'セレクター',
    fluid_valve: '流体バルブ',
    unknown: '不明',
  },
}

const uiMessages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    title: '蓝图分析工作台',
    subtitle: '这个目录已切换为 Vite + Vue 3 + TypeScript 渲染，支持上传蓝图 JSON 并即时查看统计、布局和节点明细。',
    dropPrimary: '拖拽 JSON 到这里',
    dropSecondary: '或点击选择文件',
    reload: '重新解析',
    currentFile: '当前文件',
    locale: '语言',
    jsonInput: 'JSON 输入',
    jsonInputHint: '可直接粘贴蓝图 JSON，或上传本地文件。',
    overview: '蓝图概览',
    overviewEmpty: '等待有效蓝图数据。',
    shareCode: '分享码',
    reviewStatus: '审核状态',
    sourceType: '来源',
    size: '尺寸',
    nodeCount: '节点数',
    componentCount: '组件数',
    buildingStats: '建筑统计',
    layout: '平面布局',
    layoutHint: '同一格内多个节点会以叠层方式显示；传送带和管道会按路径折线显示。',
    itemStats: '物品统计',
    itemColumn: '物品',
    countColumn: '数量',
    payloadStats: '组件类型统计',
    payloadColumn: '组件类型',
    nodeList: '节点清单',
    nodeListHint: '按 z → x → y → nodeId 排序。',
    id: 'ID',
    building: '建筑',
    item: '物品',
    position: '坐标',
    pathRoute: '路径',
    pathPoints: '点数',
    pathSegments: '段数',
    pathTurns: '拐点',
    pathLength: '长度',
    payloadType: '组件类型',
    interactive: '交互',
    trueLabel: '是',
    falseLabel: '否',
    noItem: '无',
    parseError: '蓝图解析失败。',
    missingBlueprintData: 'JSON 缺少 blueprint_data，无法识别为蓝图文件。',
    defaultDescription: '该蓝图已被加载，可查看概览、平面布局、节点统计和原始 JSON。',
  },
  'en-US': {
    title: 'Blueprint Analysis Workbench',
    subtitle: 'This workspace uses Vite + Vue 3 + TypeScript and supports local blueprint JSON upload with instant stats, layout, and node details.',
    dropPrimary: 'Drop JSON here',
    dropSecondary: 'or click to choose a file',
    reload: 'Rebuild',
    currentFile: 'Current file',
    locale: 'Language',
    jsonInput: 'JSON Input',
    jsonInputHint: 'Paste blueprint JSON directly or upload a local file.',
    overview: 'Blueprint Overview',
    overviewEmpty: 'Waiting for a valid blueprint payload.',
    shareCode: 'Share Code',
    reviewStatus: 'Review Status',
    sourceType: 'Source',
    size: 'Size',
    nodeCount: 'Nodes',
    componentCount: 'Components',
    buildingStats: 'Building Stats',
    layout: 'Layout',
    layoutHint: 'Multiple nodes in one cell are rendered as stacked layers; conveyors and pipes are rendered as path polylines.',
    itemStats: 'Item Stats',
    itemColumn: 'Item',
    countColumn: 'Count',
    payloadStats: 'Payload Type Stats',
    payloadColumn: 'Payload Type',
    nodeList: 'Node List',
    nodeListHint: 'Sorted by z → x → y → nodeId.',
    id: 'ID',
    building: 'Building',
    item: 'Item',
    position: 'Position',
    pathRoute: 'Route',
    pathPoints: 'Points',
    pathSegments: 'Segments',
    pathTurns: 'Turns',
    pathLength: 'Length',
    payloadType: 'Payload Type',
    interactive: 'Interactive',
    trueLabel: 'true',
    falseLabel: 'false',
    noItem: 'None',
    parseError: 'Failed to parse blueprint.',
    missingBlueprintData: 'JSON is missing blueprint_data and cannot be recognized as a blueprint file.',
    defaultDescription: 'The blueprint has been loaded. You can inspect overview, planar layout, node stats, and the raw JSON.',
  },
  'ja-JP': {
    title: 'ブループリント解析ワークベンチ',
    subtitle: 'このワークスペースは Vite + Vue 3 + TypeScript を使用し、ブループリント JSON のアップロード、統計、レイアウト、ノード詳細の即時表示に対応しています。',
    dropPrimary: 'ここに JSON をドロップ',
    dropSecondary: 'またはクリックしてファイルを選択',
    reload: '再解析',
    currentFile: '現在のファイル',
    locale: '言語',
    jsonInput: 'JSON 入力',
    jsonInputHint: 'ブループリント JSON を直接貼り付けるか、ローカルファイルをアップロードしてください。',
    overview: '概要',
    overviewEmpty: '有効なブループリントデータを待機しています。',
    shareCode: '共有コード',
    reviewStatus: '審査状態',
    sourceType: 'ソース',
    size: 'サイズ',
    nodeCount: 'ノード数',
    componentCount: 'コンポーネント数',
    buildingStats: '建築統計',
    layout: '平面レイアウト',
    layoutHint: '同一セル内の複数ノードは積み重ねて表示され、コンベアとパイプは折れ線として描画されます。',
    itemStats: 'アイテム統計',
    itemColumn: 'アイテム',
    countColumn: '数量',
    payloadStats: 'ペイロード種別統計',
    payloadColumn: 'ペイロード種別',
    nodeList: 'ノード一覧',
    nodeListHint: 'z → x → y → nodeId の順に並びます。',
    id: 'ID',
    building: '建物',
    item: 'アイテム',
    position: '座標',
    pathRoute: '経路',
    pathPoints: '点数',
    pathSegments: '区間数',
    pathTurns: '曲がり角',
    pathLength: '長さ',
    payloadType: 'ペイロード種別',
    interactive: 'インタラクティブ',
    trueLabel: 'はい',
    falseLabel: 'いいえ',
    noItem: 'なし',
    parseError: 'ブループリントの解析に失敗しました。',
    missingBlueprintData: 'JSON に blueprint_data がなく、ブループリントファイルとして認識できません。',
    defaultDescription: 'ブループリントが読み込まれました。概要、平面レイアウト、ノード統計、元の JSON を確認できます。',
  },
}

function humanizeIdentifier(id: string): string {
  return id
    .replace(/^item_/u, '')
    .replace(/^log_/u, '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function translateUi(locale: Locale, key: string): string {
  return uiMessages[locale][key] ?? uiMessages['en-US'][key] ?? key
}

export function translateItem(locale: Locale, itemId: string): string {
  if (!itemId || itemId === '-') {
    return translateUi(locale, 'noItem')
  }

  return itemMessages[locale][itemId] ?? itemMessages['en-US'][itemId] ?? humanizeIdentifier(itemId)
}

export function translateBuilding(locale: Locale, templateId: string): string {
  if (!templateId) {
    return buildingMessages[locale].unknown
  }

  return buildingMessages[locale][templateId] ?? buildingMessages['en-US'][templateId] ?? humanizeIdentifier(templateId)
}

export function translatePayloadType(locale: Locale, payloadType: string): string {
  if (!payloadType || payloadType === '-') {
    return translateUi(locale, 'noItem')
  }

  return payloadTypeMessages[locale][payloadType] ?? payloadTypeMessages['en-US'][payloadType] ?? payloadType
}
