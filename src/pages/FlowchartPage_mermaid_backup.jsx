import { useState, useRef, useCallback, useEffect } from 'react'
import ChartPageLayout from '../components/ChartPageLayout'
import { Download, Copy, FileImage, Palette, ChevronRight, GitBranch, Layers, BookOpen, Share2, Workflow, List, RefreshCw, Grid3X3, Pyramid, ClipboardCopy, RotateCcw, AlignLeft, Code2 } from 'lucide-react'
import mermaid from 'mermaid'

// ==================== 模板数据（按分类组织 — 单源真相） ====================
// 设计原则：同一分类下的每个模板必须有明显不同的 Mermaid 视觉布局
// 列表=并列/分组, 流程=箭矢链/分叉, 循环=闭环回连,
// 层次结构=树状/层级, 关系=多向互联, 矩阵=象限, 棱锥图=收敛/发散/金字塔

const TEMPLATE_MAP = {
  '列表': [
    { id: 'list-basic', name: '基本列表', icon: '📋',
      code: `graph TD\n  A["1. 研究背景"]\n  B["2. 研究目的"]\n  C["3. 研究方法"]\n  D["4. 数据来源"]\n  E["5. 主要结论"]\n  F["6. 研究意义"]\n  A --- B --- C --- D --- E --- F` },
    { id: 'list-alt', name: '交替流列表', icon: '📝',
      code: `graph LR\n  subgraph 阶段一\n    A["调研"]\n  end\n  subgraph 阶段二\n    B["设计"]\n  end\n  subgraph 阶段三\n    C["实验"]\n  end\n  subgraph 阶段四\n    D["分析"]\n  end\n  subgraph 阶段五\n    E["撰写"]\n  end\n  A --> B --> C --> D --> E` },
    { id: 'list-vertical', name: '垂直项目符号列表', icon: '📌',
      code: `graph TD\n  T["核心论点"]\n  T --> A["论据一: 文献支撑数据"]\n  T --> B["论据二: 实证检验结果"]\n  T --> C["论据三: 案例对比分析"]\n  T --> D["论据四: 专家评审意见"]` },
    { id: 'list-horizontal', name: '水平项目符号列表', icon: '📊',
      code: `graph LR\n  A["要素一"] --> B["要素二"]\n  B --> C["要素三"]\n  C --> D["要素四"]\n  D --> E["要素五"]` },
    { id: 'list-group', name: '分组列表', icon: '🗂',
      code: `graph TD\n  subgraph 理论基础\n    A1["文献综述"]\n    A2["概念框架"]\n  end\n  subgraph 实证分析\n    B1["数据采集"]\n    B2["统计检验"]\n  end\n  subgraph 应用建议\n    C1["政策建议"]\n    C2["管理启示"]\n  end\n  A2 --> B1\n  B2 --> C1` },
    { id: 'list-stairs', name: '阶梯列表', icon: '🪜',
      code: `graph TD\n  A["步骤1: 需求分析"]\n  B["步骤2: 方案设计"]\n  C["步骤3: 原型开发"]\n  D["步骤4: 系统测试"]\n  E["步骤5: 部署上线"]\n  F["步骤6: 运维监控"]\n  A -.-> B\n  B -.-> C\n  C -.-> D\n  D -.-> E\n  E -.-> F` },
  ],
  '流程': [
    { id: 'proc-basic', name: '基本流程', icon: '➡',
      code: `graph TD\n  A[开始] --> B[数据采集]\n  B --> C[数据预处理]\n  C --> D[特征提取]\n  D --> E[模型训练]\n  E --> F[模型评估]\n  F --> G[结果分析]\n  G --> H[结束]` },
    { id: 'proc-arrow', name: '连续箭头流程', icon: '↗',
      code: `graph LR\n  A[需求分析] ==> B[方案设计]\n  B ==> C[原型开发]\n  C ==> D[系统测试]\n  D ==> E[部署上线]\n  E ==> F[运维监控]` },
    { id: 'proc-emphasis', name: '强调流程', icon: '⭐',
      code: `graph TD\n  A[步骤一] --> B[步骤二]\n  B --> C{关键决策点}\n  C -->|方案A| D[步骤三-A]\n  C -->|方案B| E[步骤三-B]\n  D --> F[输出]\n  E --> F` },
    { id: 'proc-simple', name: '简单流程', icon: '▸',
      code: `graph LR\n  A[输入] --> B[处理]\n  B --> C[输出]\n  C --> D[评估]` },
    { id: 'proc-vertical', name: '垂直流程', icon: '⬇',
      code: `graph TD\n  A[问题定义] --> B[文献综述]\n  B --> C{假设检验}\n  C -->|通过| D[实验设计]\n  C -->|修正| B\n  D --> E[数据采集]\n  E --> F[统计分析]\n  F --> G[结果讨论]\n  G --> H[结论]` },
    { id: 'proc-horizontal', name: '水平流程', icon: '➡️',
      code: `graph LR\n  S[开始] --> P1[步骤一]\n  P1 --> P2[步骤二]\n  P2 --> P3[步骤三]\n  P3 --> P4[步骤四]\n  P4 --> P5[步骤五]\n  P5 --> E[结束]` },
    { id: 'proc-branch', name: '分支流程', icon: '⑂',
      code: `graph TD\n  A[总任务] --> B1[子任务A]\n  A --> B2[子任务B]\n  A --> B3[子任务C]\n  B1 --> C1[结果A]\n  B2 --> C2[结果B]\n  B3 --> C3[结果C]\n  C1 --> D[汇总]\n  C2 --> D\n  C3 --> D` },
    { id: 'proc-closed', name: '闭环流程', icon: '🔄',
      code: `graph TD\n  A[计划] --> B[执行]\n  B --> C[检查]\n  C --> D[改进]\n  D -.-> A` },
    { id: 'proc-paper', name: '论文写作流程', icon: '📝',
      code: `graph LR\n  A[选题] --> B[调研]\n  B --> C[开题]\n  C --> D[实验]\n  D --> E[分析]\n  E --> F[初稿]\n  F --> G[修改]\n  G --> H[查重]\n  H --> I[投稿]` },
  ],
  '循环': [
    { id: 'cyc-basic', name: '基本循环', icon: '🔁',
      code: `graph TD\n  A[初始化] --> B{条件判断}\n  B -->|满足| C[执行操作]\n  C --> D[更新状态]\n  D --> B\n  B -->|不满足| E[输出结果]` },
    { id: 'cyc-text', name: '文本循环', icon: '🔄',
      code: `graph LR\n  A[数据收集] --> B[模型训练]\n  B --> C[效果评估]\n  C --> D[参数调整]\n  D --> A\n  D --> E{达标?}\n  E -->|是| F[发布]\n  E -->|否| A` },
    { id: 'cyc-continuous', name: '连续循环', icon: '♻',
      code: `graph TD\n  A[实验设计] --> B[实验执行]\n  B --> C[结果分析]\n  C --> D{验证?}\n  D -->|证实| E[理论确认]\n  D -->|否定| F[修正假设]\n  F --> A` },
    { id: 'cyc-segmented', name: '分段循环', icon: '🔂',
      code: `graph TD\n  P1[阶段一: 定义] --> P2[阶段二: 设计]\n  P2 --> P3[阶段三: 实施]\n  P3 --> P4[阶段四: 评估]\n  P4 --> P1\n  P4 --> R[输出成果]` },
    { id: 'cyc-feedback', name: '反馈循环', icon: '📡',
      code: `graph LR\n  A[输入信号] --> B[系统处理]\n  B --> C[输出响应]\n  C --> D[反馈检测]\n  D -.->|调整| A\n  D --> E[稳定输出]` },
    { id: 'cyc-research', name: '科研循环', icon: '🔬',
      code: `graph LR\n  A[提出\n问题] --> B[文献\n查阅]\n  B --> C[假设\n构建]\n  C --> D[实验\n设计]\n  D --> E[数据\n采集]\n  E --> F[结果\n分析]\n  F --> G{验证?}\n  G -->|是| H[论文\n发表]\n  G -->|否| C\n  H --> I[新问题]\n  I --> A` },
  ],
  '层次结构': [
    { id: 'hier-org', name: '组织结构图', icon: '🏛',
      code: `graph TD\n  A[项目负责人] --> B[技术组长]\n  A --> C[实验组长]\n  A --> D[行政组长]\n  B --> B1[工程师A]\n  B --> B2[工程师B]\n  C --> C1[研究员A]\n  C --> C2[研究员B]\n  D --> D1[财务]\n  D --> D2[后勤]` },
    { id: 'hier-horiz', name: '水平层次结构', icon: '◼',
      code: `graph LR\n  A[学校] --> B[学院A]\n  A --> C[学院B]\n  A --> D[学院C]\n  B --> E[系1]\n  B --> F[系2]\n  C --> G[系3]\n  E --> H[教研室]\n  F --> H` },
    { id: 'hier-vert', name: '垂直层次结构', icon: '📐',
      code: `graph TD\n  A[学科门类] --> B[一级学科]\n  B --> C[二级学科]\n  C --> D[研究方向]\n  D --> E[具体课题]\n  E --> F[实验方案]` },
    { id: 'hier-labeled', name: '带标签的层次结构', icon: '🏷',
      code: `graph TD\n  A[决策层] -->|制定战略| B[管理层]\n  B -->|分配任务| C[执行层]\n  C -->|反馈结果| B\n  B -->|汇报| A\n  C --> D[支撑层]\n  D -->|提供资源| C` },
    { id: 'hier-tree', name: '树形结构', icon: '🌳',
      code: `graph LR\n  ROOT[根节点] --> L1[左子树]\n  ROOT --> R1[右子树]\n  L1 --> L2[叶A]\n  L1 --> L3[叶B]\n  R1 --> R2[叶C]\n  R1 --> R3[叶D]` },
    { id: 'hier-review', name: '审稿流程', icon: '📋',
      code: `graph TD\n  A[投稿] --> B[编辑初审]\n  B --> C{决定}\n  C -->|送审| D[同行评审]\n  C -->|退稿| E[退稿通知]\n  D --> F{评审意见}\n  F -->|接收| G[排版发表]\n  F -->|修改| H[作者修改]\n  F -->|拒稿| E\n  H --> I[复审]\n  I --> D` },
  ],
  '关系': [
    { id: 'rel-venn', name: '基本维恩图', icon: '⭕',
      code: `graph TD\n  A[因素A] --> C[共同影响]\n  B[因素B] --> C\n  C --> D[综合结果]\n  A -.-> E[A独立效应]\n  B -.-> F[B独立效应]` },
    { id: 'rel-stacked', name: '堆叠维恩图', icon: '🎯',
      code: `graph TD\n  A[领域A] --> I[重叠区]\n  B[领域B] --> I\n  C[领域C] --> I\n  I --> D[跨学科创新]` },
    { id: 'rel-radial', name: '放射关系图', icon: '☀',
      code: `graph TD\n  CENTER[核心概念] --> N["北: 理论"]\n  CENTER --> S["南: 应用"]\n  CENTER --> E1["东: 方法"]\n  CENTER --> W["西: 数据"]\n  CENTER --> NE["东北: 交叉"]\n  CENTER --> SW["西南: 验证"]` },
    { id: 'rel-inter', name: '相互关联', icon: '🔗',
      code: `graph TD\n  A[变量X] -->|正向| C[变量Z]\n  B[变量Y] -->|正向| C\n  A -->|负向| D[变量W]\n  B -->|负向| D\n  C --> E[最终结果]\n  D --> E` },
    { id: 'rel-target', name: '目标图', icon: '🎯',
      code: `graph LR\n  A[总目标] --> B[子目标1]\n  A --> C[子目标2]\n  A --> D[子目标3]\n  B --> E[任务a]\n  B --> F[任务b]\n  C --> G[任务c]\n  C --> H[任务d]\n  D --> I[任务e]` },
    { id: 'rel-timeline', name: '时间线关系', icon: '📅',
      code: `graph LR\n  A["2019\n立项"] --> B["2020\n调研"]\n  B --> C["2021\n实验"]\n  C --> D["2022\n分析"]\n  D --> E["2023\n撰写"]\n  E --> F["2024\n发表"]\n  A -.-> G[基金支持]\n  F -.-> H[学术影响]` },
  ],
  '矩阵': [
    { id: 'mat-basic', name: '基本矩阵', icon: '▦',
      code: `graph TD\n  Q11["象限I\n高重要-高紧急"]\n  Q12["象限II\n高重要-低紧急"]\n  Q21["象限III\n低重要-高紧急"]\n  Q22["象限IV\n低重要-低紧急"]\n  Q11 --- Q12\n  Q11 --- Q21\n  Q12 --- Q22\n  Q21 --- Q22` },
    { id: 'mat-grid', name: '网格矩阵', icon: '🔲',
      code: `graph TD\n  A["横轴: 重要性"] --> B["纵轴: 紧急性"]\n  B --> C1["I 重要-紧急"]\n  B --> C2["II 重要-不紧急"]\n  B --> C3["III 不重要-紧急"]\n  B --> C4["IV 不重要-不紧急"]` },
    { id: 'mat-labeled', name: '带标签矩阵', icon: '🏷',
      code: `graph TD\n  A[BCG矩阵] --> B["★ 明星业务\n高增长-高份额"]\n  A --> C["? 问题业务\n高增长-低份额"]\n  A --> D["$ 现金牛\n低增长-高份额"]\n  A --> E["✕ 瘦狗业务\n低增长-低份额"]\n  B -->|投入| F[市场占有率]\n  D -->|收割| F` },
    { id: 'mat-swot', name: 'SWOT矩阵', icon: '📈',
      code: `graph TD\n  S["S: 优势"] --> SO["SO策略\n增长"]\n  W["W: 劣势"] --> WO["WO策略\n扭转"]\n  O["O: 机会"] --> SO\n  O --> ST["ST策略\n多元"]\n  T["T: 威胁"] --> ST\n  T --> WT["WT策略\n防御"]` },
    { id: 'mat-priority', name: '优先级矩阵', icon: '📊',
      code: `graph TD\n  A[评估维度] --> B[影响程度]\n  A --> C[发生概率]\n  B --> D1["高风险-高影响"]\n  B --> D2["低风险-高影响"]\n  C --> D1\n  C --> D3["高风险-低影响"]\n  D1 --> E[立即处理]\n  D2 --> F[制定预案]\n  D3 --> G[持续监测]` },
  ],
  '棱锥图': [
    { id: 'pyr-basic', name: '基本棱锥图', icon: '🔺',
      code: `graph TD\n  subgraph L4["顶层 战略"]\n    A["愿景与使命"]\n  end\n  subgraph L3["战术层"]\n    B1["规划A"] --- B2["规划B"]\n  end\n  subgraph L2["执行层"]\n    C1["方案1"] --- C2["方案2"] --- C3["方案3"]\n  end\n  subgraph L1["操作层"]\n    D1["任务a"] --- D2["任务b"] --- D3["任务c"] --- D4["任务d"]\n  end\n  A --> B1 & B2\n  B1 --> C1 & C2\n  B2 --> C2 & C3\n  C1 --> D1 & D2\n  C2 --> D2 & D3\n  C3 --> D3 & D4` },
    { id: 'pyr-seg', name: '分段棱锥图', icon: '🔻',
      code: `graph TD\n  subgraph 战略层\n    A["总体目标"]\n  end\n  subgraph 业务层\n    B1["左段\n研发"] ~~~ B2["右段\n市场"]\n  end\n  subgraph 支撑层\n    C1["人力"] ~~~ C2["财务"] ~~~ C3["技术"]\n  end\n  A --> B1 & B2\n  B1 --> C1 & C3\n  B2 --> C2 & C3` },
    { id: 'pyr-invert', name: '倒置棱锥图', icon: '🔽',
      code: `graph TD\n  subgraph WIDE["选题层 广泛"]\n    T1["方向A"] --- T2["方向B"] --- T3["方向C"] --- T4["方向D"]\n  end\n  subgraph MID["聚焦层"]\n    F1["课题1"] ~~~ F2["课题2"]\n  end\n  subgraph NARROW["精炼层"]\n    R["研究问题"]\n  end\n  T1 & T2 --> F1\n  T3 & T4 --> F2\n  F1 & F2 --> R` },
    { id: 'pyr-layer', name: '层级棱锥图', icon: '📶',
      code: `graph TD\n  L1["愿景层"] -->|指引| L2["目标层"]\n  L2["目标层"] -->|分解| L3["策略层"]\n  L3["策略层"] -->|落地| L4["任务层"]\n  L4["任务层"] -->|拆解| L5["活动层"]\n  L5["活动层"] -->|需要| L6["资源层"]` },
    { id: 'pyr-funnel', name: '漏斗分析图', icon: '🔽',
      code: `graph TD\n  A["👥 潜在用户 100%\n网站访客"]\n  B["🔍 了解产品 60%\n浏览详情"]\n  C["💡 产生兴趣 30%\n加购试用"]\n  D["🧪 试用体验 15%\n注册申请"]\n  E["💰 购买转化 5%\n下单付款"]\n  F["⭐ 忠实用户 2%\n复购推荐"]\n  A --> B\n  B --> C\n  C --> D\n  D --> E\n  E --> F` },
  ],
}

// 从 TEMPLATE_MAP 派生，自动注入 category — 根除分类字符串不一致
const ALL_TEMPLATES = Object.entries(TEMPLATE_MAP).flatMap(([category, templates]) =>
  templates.map(t => ({ ...t, category }))
)

const CATEGORIES = Object.keys(TEMPLATE_MAP).map(key => ({
  key,
  icon: { '列表': List, '流程': Workflow, '循环': RefreshCw, '层次结构': Share2, '关系': Layers, '矩阵': Grid3X3, '棱锥图': Pyramid }[key]
}))

// ---- 5 Themes ----
const THEMES = [
  { id: 'sky', name: '天空蓝', config: { theme: 'base', themeVariables: { primaryColor: '#EBF5FF', primaryTextColor: '#334155', primaryBorderColor: '#93C5FD', lineColor: '#93C5FD', secondaryColor: '#DBEAFE', tertiaryColor: '#F0F9FF', fontSize: '15px', fontFamily: '"Inter",system-ui,sans-serif' } } },
  { id: 'mint', name: '薄荷绿', config: { theme: 'base', themeVariables: { primaryColor: '#E6F7E6', primaryTextColor: '#334155', primaryBorderColor: '#6EE7B7', lineColor: '#6EE7B7', secondaryColor: '#D1FAE5', tertiaryColor: '#ECFDF5', fontSize: '15px', fontFamily: '"Inter",system-ui,sans-serif' } } },
  { id: 'sakura', name: '樱花粉', config: { theme: 'base', themeVariables: { primaryColor: '#FCE7F3', primaryTextColor: '#334155', primaryBorderColor: '#F9A8D4', lineColor: '#F9A8D4', secondaryColor: '#FCE7F3', tertiaryColor: '#FDF2F8', fontSize: '15px', fontFamily: '"Inter",system-ui,sans-serif' } } },
  { id: 'lavender', name: '薰衣草紫', config: { theme: 'base', themeVariables: { primaryColor: '#EDE9FE', primaryTextColor: '#334155', primaryBorderColor: '#A78BFA', lineColor: '#A78BFA', secondaryColor: '#DDD6FE', tertiaryColor: '#F5F3FF', fontSize: '15px', fontFamily: '"Inter",system-ui,sans-serif' } } },
  { id: 'amber', name: '暖琥珀', config: { theme: 'base', themeVariables: { primaryColor: '#FEF3C7', primaryTextColor: '#334155', primaryBorderColor: '#FCD34D', lineColor: '#FCD34D', secondaryColor: '#FDE68A', tertiaryColor: '#FFFBEB', fontSize: '15px', fontFamily: '"Inter",system-ui,sans-serif' } } },
]

const NODE_SHAPES = [
  { id: 'rect', label: '矩形 [ ]', bracket: ['[', ']'] },
  { id: 'round', label: '圆角 ( )', bracket: ['(', ')'] },
  { id: 'diamond', label: '菱形 { }', bracket: ['{', '}'] },
]

function svgToPngDataUrl(svgElement) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const rect = svgElement.getBoundingClientRect()
    canvas.width = Math.max(rect.width, 600) * 2
    canvas.height = Math.max(rect.height, 300) * 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    const img = new Image()
    const svgData = new XMLSerializer().serializeToString(svgElement)
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/png')) }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  })
}

function autoFormatCode(code) {
  return code.split('\n').map(line => {
    let trimmed = line.trim()
    if (!trimmed) return ''
    // 在箭头两侧加空格，但保护 |边缘标签| 和 :文本: 不被破坏
    // 只在箭头后面不是 | 或 : 时才加空格
    trimmed = trimmed.replace(/(--?>|==>|-\.->)(\S)/g, (m, arrow, next) => {
      // 如果下一个字符是 | 或 : （边缘标签/链接开头），不加空格
      if (next === '|' || next === ':') return m
      return arrow + ' ' + next
    })
    trimmed = trimmed.replace(/(\S)(--?>|==>|-\.->)/g, '$1 $2')
    // Normalize indent to 2 spaces per level
    const indent = (line.match(/^\s*/) || [''])[0].length
    const level = Math.max(0, Math.round(indent / 2))
    return '  '.repeat(level) + trimmed
  }).join('\n')
}

function applyNodeShape(code, shape) {
  if (shape === 'rect') return code // Default, no change needed
  // Replace [text] with chosen bracket type
  const bracketMap = { round: ['(', ')'], diamond: ['{', '}'] }
  const [open, close] = bracketMap[shape] || ['[', ']']
  return code.replace(/\[([^\]]+?)\]/g, `${open}$1${close}`)
}

const DEFAULT_CATEGORY = '流程'
const DEFAULT_TEMPLATE = TEMPLATE_MAP[DEFAULT_CATEGORY][0]

export default function FlowchartPage() {
  const [code, setCode] = useState(DEFAULT_TEMPLATE.code)
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATE.id)
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY)
  const [theme, setTheme] = useState('sky')
  const [nodeShape, setNodeShape] = useState('rect')
  const [copied, setCopied] = useState(false)
  const [copyingSvg, setCopyingSvg] = useState(false)
  const [copyingPng, setCopyingPng] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const themeConfig = THEMES.find(t => t.id === theme)?.config || THEMES[0].config

  const renderDiagram = useCallback(async () => {
    if (!containerRef.current) return
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', ...themeConfig })
      const id = `fc-${Date.now()}`
      const { svg } = await mermaid.render(id, code)
      containerRef.current.innerHTML = svg
      setError('')
    } catch (e) {
      const msg = e.message || ''
      const lineMatch = msg.match(/line\s+(\d+)/i) || msg.match(/第\s*(\d+)/)
      let friendly = msg
      if (lineMatch) friendly = `第 ${lineMatch[1]} 行附近语法错误，请检查箭头方向、括号配对或空格。`
      else if (msg.includes('Parse')) friendly = '语法解析错误，请检查代码中箭头（-->）和括号配对是否正确。'
      else if (msg.includes('Lex')) friendly = '词法错误，请检查是否有非法字符或未闭合的引号。'
      setError(friendly)
      containerRef.current.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-center p-6 max-w-md"><p class="text-amber-500 text-sm mb-1">⚠ 渲染失败</p><p class="text-xs text-gray-500 font-mono whitespace-pre-wrap">${friendly}</p></div></div>`
    }
  }, [code, themeConfig])

  useEffect(() => { renderDiagram() }, [renderDiagram])

  const handleTemplateClick = (t) => { setCode(t.code); setActiveTemplate(t.id) }

  const handleFormat = () => setCode(autoFormatCode(code))

  const handleNodeShapeChange = (shapeId) => {
    setNodeShape(shapeId)
    // Find a template and apply shape to it
    const baseCode = activeTemplate ? ALL_TEMPLATES.find(t => t.id === activeTemplate)?.code || code : code
    setCode(applyNodeShape(baseCode, shapeId))
  }

  const handleReset = () => {
    setCode(DEFAULT_TEMPLATE.code);
    setActiveTemplate(DEFAULT_TEMPLATE.id);
    setActiveCategory(DEFAULT_CATEGORY)
    setTheme('sky'); setNodeShape('rect')
  }

  const handleExportPNG = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const dataUrl = await svgToPngDataUrl(svg)
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'flowchart.png'; a.click()
  }, [])

  const handleExportSVG = useCallback(() => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'flowchart.svg'; a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleCopySVG = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) { alert('未找到可复制的流程图'); return }
    setCopyingSvg(true)
    try {
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingSvg(false); setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch (e) { alert('复制失败，请右键点击预览图手动复制'); setCopyingSvg(false) }
  }, [])

  const handleCopyPNG = useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) { alert('未找到可复制的流程图'); return }
    setCopyingPng(true)
    try {
      const dataUrl = await svgToPngDataUrl(svg)
      const resp = await fetch(dataUrl)
      const blob = await resp.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyingPng(false); setCopied(true); setTimeout(() => setCopied(false), 1500)
    } catch (e) { alert('复制失败，请尝试下载 PNG 或右键手动复制'); setCopyingPng(false) }
  }, [])

  const handleCopyCode = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const filteredTemplates = ALL_TEMPLATES.filter(t => t.category === activeCategory)
  const lines = code.split('\n')

  return (
    <ChartPageLayout title="流程图生成器" breadcrumb="流程图">
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* LEFT: Template Library */}
        <div className="lg:w-72 flex-shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[700px]">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-2">
              <GitBranch size={15} className="text-[#93C5FD]" />
              模板库 <span className="text-xs text-gray-400 font-normal ml-auto">{ALL_TEMPLATES.length}套</span>
            </h3>
          </div>
          <div className="px-2 py-2 border-b border-gray-50 bg-gray-50/50 flex flex-wrap gap-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all flex items-center gap-1 ${activeCategory === cat.key ? 'bg-[#1E3A5F] text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`}>
                  <Icon size={11} />{cat.key}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-[11px] text-gray-400 px-2 py-1 font-medium">{activeCategory} · {filteredTemplates.length} 套</div>
            <div className="space-y-0.5">
              {filteredTemplates.map(t => (
                <button key={t.id} onClick={() => handleTemplateClick(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 ${activeTemplate === t.id ? 'bg-[#1E3A5F]/8 border border-[#1E3A5F]/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <span className="text-sm w-5 text-center">{t.icon}</span>
                  <span className={`text-sm leading-tight truncate ${activeTemplate === t.id ? 'text-[#1E3A5F] font-semibold' : 'text-gray-600'}`}>{t.name}</span>
                  {activeTemplate === t.id && <ChevronRight size={12} className="ml-auto text-[#3B82F6] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Editor + Preview */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Editor */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-[#1E3A5F]">代码编辑器</h3>
                <div className="flex items-center gap-1.5">
                  <Palette size={12} className="text-gray-400" />
                  <select value={theme} onChange={e => setTheme(e.target.value)}
                    className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 bg-white outline-none">
                    {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">节点形状</span>
                  {NODE_SHAPES.map(ns => (
                    <button key={ns.id} onClick={() => handleNodeShapeChange(ns.id)}
                      className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${nodeShape === ns.id ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{ns.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleFormat} className="px-2 py-1 text-[10px] rounded bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center gap-1"><AlignLeft size={10}/>格式化</button>
                <button onClick={handleReset} className="px-2 py-1 text-[10px] rounded bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center gap-1"><RotateCcw size={10}/>重置</button>
                <button onClick={handleCopyCode} className={`px-2 py-1 text-[10px] rounded font-medium flex items-center gap-1 ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><Copy size={10}/>{copied ? '已复制' : '复制代码'}</button>
              </div>
            </div>
            {/* Code with line numbers */}
            <div className="flex">
              <div className="bg-gray-50 text-right py-4 pl-3 pr-2 select-none border-r border-gray-100 text-[11px] text-gray-400 font-mono leading-relaxed">
                {lines.map((_, i) => <div key={i} className="h-[1.4rem]">{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => { setCode(e.target.value); setActiveTemplate('') }}
                className="flex-1 h-48 text-sm font-mono p-4 outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700 flex items-start gap-2">
              <span>⚠</span>{error}
            </div>
          )}

          {/* Preview */}
          <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-[#1E3A5F]">实时预览</h3>
              <div className="flex items-center gap-1.5">
                <button onClick={handleCopySVG} className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${copyingSvg || copied ? 'bg-green-100 text-green-700' : 'bg-[#1E3A5F] text-white hover:bg-[#152E4A]'}`}><ClipboardCopy size={11}/>{copyingSvg ? '复制中...' : copied ? '已复制' : '复制SVG'}</button>
                <button onClick={handleCopyPNG} className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${copyingPng ? 'bg-green-100 text-green-700' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'}`}>{copyingPng ? '复制中...' : <><ClipboardCopy size={11}/>复制PNG</>}</button>
                <button onClick={handleExportSVG} className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center gap-1"><Download size={11}/>SVG</button>
                <button onClick={handleExportPNG} className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center gap-1"><FileImage size={11}/>PNG</button>
              </div>
            </div>
            <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 bg-gray-50/30 overflow-auto" />
          </div>
        </div>
      </div>

      <div className="mt-4 p-3.5 bg-[#1E3A5F]/5 rounded-lg">
        <p className="text-[11px] text-[#6B7280]">
          共 {ALL_TEMPLATES.length} 套模板，覆盖 7 大类别。5 套主题配色，节点形状可选矩形/圆角/菱形。
        </p>
        <p className="text-[11px] text-[#6B7280] mt-1">
          💡 操作提示：点击「复制 SVG」后将矢量图粘贴到 Word 中，选中图片 → 右键「编辑图片」→「转换为形状」，即可修改文字和线条（仅限 Word 2016+）。
        </p>
      </div>
    </ChartPageLayout>
  )
}
