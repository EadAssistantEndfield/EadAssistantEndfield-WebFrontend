import { buildingMessages } from './buildingMessages'

export const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'] as const
export type Locale = (typeof supportedLocales)[number]

interface UiMessages {
  title: string
  headerSubtitle: string
  subtitle: string
  dropPrimary: string
  dropSecondary: string
  reload: string
  currentFile: string
  locale: string
  localeNameZhCN: string
  localeNameEnUS: string
  localeNameJaJP: string
  jsonInput: string
  jsonInputHint: string
  overview: string
  overviewEmpty: string
  shareCode: string
  reviewStatus: string
  sourceType: string
  size: string
  nodeCount: string
  componentCount: string
  buildingStats: string
  layout: string
  layoutHint: string
  layoutInferenceHint: string
  layoutViewFlag: string
  layoutModeNormalized: string
  layoutModeSource: string
  itemStats: string
  itemColumn: string
  countColumn: string
  payloadStats: string
  payloadColumn: string
  nodeList: string
  nodeListHint: string
  nodeMatrixFlag: string
  id: string
  building: string
  item: string
  position: string
  pathRoute: string
  pathPoints: string
  pathSegments: string
  pathTurns: string
  pathLength: string
  payloadType: string
  interactive: string
  trueLabel: string
  falseLabel: string
  noItem: string
  parseError: string
  missingBlueprintData: string
  defaultDescription: string
  headerStatusJson: string
  headerStatusLayout: string
  copyUnavailable: string
  copied: string
  chooseFile: string
  viewLayout: string
  viewJson: string
  debugOverlay: string
  sectionFacilities: string
  sectionInputOutput: string
  inputLabel: string
  outputLabel: string
  overviewSourceArea: string
  overviewPowerRequirement: string
  overviewSize: string
  nodeToggleCollapse: string
  nodeToggleExpand: string
  layoutLabel: string
  sourceLayoutLabel: string
  footprintLabel: string
  resetZoom: string
  queryPlaceholder: string
  queryButton: string
  querying: string
  queryErrorNetwork: string
  queryErrorNoData: string
  queryCreatingSession: string
  queryWaitingScan: string
  queryScanned: string
  querySessionError: string
  querySessionTimeout: string
  queryCancel: string
}

export const itemMessages: Record<Locale, Record<string, string>> = {
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

export const payloadTypeMessages: Record<Locale, Record<string, string>> = {
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

export const uiMessages: Record<Locale, UiMessages> = {
  'zh-CN': {
    title: '蓝图分析工作台',
    headerSubtitle: '//View Blueprint',
    subtitle: '这个目录已切换为 Vite + Vue 3 + TypeScript 渲染，支持上传蓝图 JSON 并即时查看统计、布局和节点明细。',
    dropPrimary: '拖拽 JSON 到这里',
    dropSecondary: '或点击选择文件',
    reload: '重新解析',
    currentFile: '当前文件',
    locale: '语言',
    localeNameZhCN: '简体中文',
    localeNameEnUS: '英语',
    localeNameJaJP: '日语',
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
    layoutInferenceHint: '游戏还原模式会结合 footprint、旋转和邻近路径自动推断占地。',
    layoutViewFlag: '//Layout View',
    layoutModeNormalized: '游戏还原模式',
    layoutModeSource: 'JSON 原始模式',
    itemStats: '物品统计',
    itemColumn: '物品',
    countColumn: '数量',
    payloadStats: '组件类型统计',
    payloadColumn: '组件类型',
    nodeList: '节点清单',
    nodeListHint: '按 z → x → y → nodeId 排序。',
    nodeMatrixFlag: '//Node Matrix',
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
    headerStatusJson: '//当前为JSON查看模式',
    headerStatusLayout: '//当前为图表查看模式',
    copyUnavailable: '不可复制',
    copied: '已复制',
    chooseFile: '文件',
    viewLayout: '图表',
    viewJson: 'JSON',
    debugOverlay: '调试覆盖',
    sectionFacilities: '需求设备',
    sectionInputOutput: '输入/产出',
    inputLabel: '输入',
    outputLabel: '输出',
    overviewSourceArea: '基地区域',
    overviewPowerRequirement: '功率要求',
    overviewSize: '蓝图尺寸',
    nodeToggleCollapse: '收起',
    nodeToggleExpand: '展开',
    layoutLabel: 'layout',
    sourceLayoutLabel: 'source',
    footprintLabel: 'footprint',
    resetZoom: '重置缩放',
    queryPlaceholder: '输入蓝图码查询...',
    queryButton: '查询',
    querying: '查询中...',
    queryErrorNetwork: '网络请求失败，请检查网络连接。',
    queryErrorNoData: '返回数据中缺少 blueprint_data。',
    queryCreatingSession: '正在创建会话...',
    queryWaitingScan: '请使用明日方舟：终末地扫描二维码登录',
    queryScanned: '扫码成功，正在查询蓝图...',
    querySessionError: '会话创建失败，请重试。',
    querySessionTimeout: '登录等待超时，请重新扫码。',
    queryCancel: '取消',
  },
  'en-US': {
    title: 'Blueprint Analysis Workbench',
    headerSubtitle: '//View Blueprint',
    subtitle:
      'This workspace uses Vite + Vue 3 + TypeScript and supports local blueprint JSON upload with instant stats, layout, and node details.',
    dropPrimary: 'Drop JSON here',
    dropSecondary: 'or click to choose a file',
    reload: 'Rebuild',
    currentFile: 'Current file',
    locale: 'Language',
    localeNameZhCN: 'Simplified Chinese',
    localeNameEnUS: 'English',
    localeNameJaJP: 'Japanese',
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
    layoutInferenceHint: 'Game reconstruction mode infers occupied area from footprint, rotation, and nearby paths.',
    layoutViewFlag: '//Layout View',
    layoutModeNormalized: 'Game Reconstruction',
    layoutModeSource: 'Raw JSON',
    itemStats: 'Item Stats',
    itemColumn: 'Item',
    countColumn: 'Count',
    payloadStats: 'Payload Type Stats',
    payloadColumn: 'Payload Type',
    nodeList: 'Node List',
    nodeListHint: 'Sorted by z → x → y → nodeId.',
    nodeMatrixFlag: '//Node Matrix',
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
    headerStatusJson: '//JSON view mode',
    headerStatusLayout: '//Layout view mode',
    copyUnavailable: 'Unavailable',
    copied: 'Copied',
    chooseFile: 'File',
    viewLayout: 'Layout',
    viewJson: 'JSON',
    debugOverlay: 'Debug Overlay',
    sectionFacilities: 'Facilities',
    sectionInputOutput: 'Input / Output',
    inputLabel: 'Input',
    outputLabel: 'Output',
    overviewSourceArea: 'Source Area',
    overviewPowerRequirement: 'Power',
    overviewSize: 'Blueprint Size',
    nodeToggleCollapse: 'Collapse',
    nodeToggleExpand: 'Expand',
    layoutLabel: 'layout',
    sourceLayoutLabel: 'source',
    footprintLabel: 'footprint',
    resetZoom: 'Reset Zoom',
    queryPlaceholder: 'Enter share code to query...',
    queryButton: 'Query',
    querying: 'Querying...',
    queryErrorNetwork: 'Network request failed. Please check your connection.',
    queryErrorNoData: 'Response is missing blueprint_data.',
    queryCreatingSession: 'Creating session...',
    queryWaitingScan: 'Scan the QR code with Endfield to log in',
    queryScanned: 'Scan successful, querying blueprint...',
    querySessionError: 'Session creation failed. Please retry.',
    querySessionTimeout: 'Login timed out. Please scan the QR code again.',
    queryCancel: 'Cancel',
  },
  'ja-JP': {
    title: 'ブループリント解析ワークベンチ',
    headerSubtitle: '//View Blueprint',
    subtitle:
      'このワークスペースは Vite + Vue 3 + TypeScript を使用し、ブループリント JSON のアップロード、統計、レイアウト、ノード詳細の即時表示に対応しています。',
    dropPrimary: 'ここに JSON をドロップ',
    dropSecondary: 'またはクリックしてファイルを選択',
    reload: '再解析',
    currentFile: '現在のファイル',
    locale: '言語',
    localeNameZhCN: '簡体字中国語',
    localeNameEnUS: '英語',
    localeNameJaJP: '日本語',
    jsonInput: 'JSON 入力',
    jsonInputHint: 'ブループリント JSON を直接貼り付けるか、ローカルファイルをアップロードしてください。',
    overview: 'ブループリント概要',
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
    layoutInferenceHint: 'ゲーム再現モードでは footprint、回転、周辺経路から占有範囲を自動推定します。',
    layoutViewFlag: '//Layout View',
    layoutModeNormalized: 'ゲーム再現モード',
    layoutModeSource: 'JSON 原文',
    itemStats: 'アイテム統計',
    itemColumn: 'アイテム',
    countColumn: '数量',
    payloadStats: 'ペイロード種別統計',
    payloadColumn: 'ペイロード種別',
    nodeList: 'ノード一覧',
    nodeListHint: 'z → x → y → nodeId の順に並びます。',
    nodeMatrixFlag: '//Node Matrix',
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
    headerStatusJson: '//JSON 表示モード',
    headerStatusLayout: '//レイアウト表示モード',
    copyUnavailable: 'コピー不可',
    copied: 'コピー済み',
    chooseFile: 'ファイル',
    viewLayout: 'レイアウト',
    viewJson: 'JSON',
    debugOverlay: 'デバッグオーバーレイ',
    sectionFacilities: '必要設備',
    sectionInputOutput: '入出力',
    inputLabel: '入力',
    outputLabel: '出力',
    overviewSourceArea: '拠点エリア',
    overviewPowerRequirement: '電力要件',
    overviewSize: 'ブループリントサイズ',
    nodeToggleCollapse: '折りたたむ',
    nodeToggleExpand: '展開',
    layoutLabel: 'layout',
    sourceLayoutLabel: 'source',
    footprintLabel: 'footprint',
    resetZoom: 'ズームをリセット',
    queryPlaceholder: '共有コードを入力して検索...',
    queryButton: '検索',
    querying: '検索中...',
    queryErrorNetwork: 'ネットワークリクエストに失敗しました。接続を確認してください。',
    queryErrorNoData: 'レスポンスに blueprint_data がありません。',
    queryCreatingSession: 'セッションを作成中...',
    queryWaitingScan: 'エンドフィールドでQRコードをスキャンしてログインしてください',
    queryScanned: 'スキャン成功、ブループリントを検索中...',
    querySessionError: 'セッションの作成に失敗しました。再試行してください。',
    querySessionTimeout: 'ログイン待機がタイムアウトしました。QRコードを再度スキャンしてください。',
    queryCancel: 'キャンセル',
  },
}

export type UiMessageKey = keyof UiMessages

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && supportedLocales.includes(value as Locale))
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

export function getLocaleOptions(displayLocale: Locale): Array<{ value: Locale; label: string }> {
  return [
    { value: 'zh-CN', label: translateUi(displayLocale, 'localeNameZhCN') },
    { value: 'en-US', label: translateUi(displayLocale, 'localeNameEnUS') },
    { value: 'ja-JP', label: translateUi(displayLocale, 'localeNameJaJP') },
  ]
}

export function translateUi(locale: Locale, key: UiMessageKey): string {
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
