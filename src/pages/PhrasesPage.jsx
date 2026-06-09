import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'

// 学术句式数据 - 4 类，每类 13+ 条，共 52+ 条
const phrasesData = {
  introduction: {
    label: '引言/背景',
    color: 'bg-blue-600',
    items: [
      '近年来，随着……的快速发展，……已成为研究热点。',
      '……在……领域受到了广泛关注，然而……仍存在不足。',
      '已有研究表明，……对……具有重要影响，但其机制尚不明确。',
      '……问题是当前学术界和实践领域的焦点之一。',
      '尽管……取得了显著进展，但关于……的研究仍然有限。',
      '在……背景下，探讨……对……的影响具有重要的理论价值。',
      '……的概念最早由……提出，此后引起了广泛讨论。',
      '本文旨在研究……，以期为……提供理论依据。',
      '过去几十年，关于……的研究多集中于……',
      '随着……技术的不断进步，……展现出广阔的应用前景。',
      '目前，学界对……尚未形成统一认识，有待进一步探讨。',
      '……作为一个新兴研究领域，吸引了越来越多学者的关注。',
      '在文献回顾的基础上，本研究聚焦于……问题。',
      '……的迅速发展对……提出了新的挑战和机遇。',
    ],
  },
  methods: {
    label: '方法/实验',
    color: 'bg-green-600',
    items: [
      '本文采用……方法对……进行实证分析。',
      '为了验证假设，本研究设计了……实验方案。',
      '数据来源于……，样本包括……，时间跨度为……',
      '本研究综合运用了定量分析与定性分析相结合的方法。',
      '以……为理论基础，构建了……分析框架。',
      '实验分为……组，其中……为对照组，其余为实验组。',
      '采用……软件对数据进行统计分析，显著性水平设为 p < 0.05。',
      '本研究采用问卷调查法收集数据，共发放问卷……份。',
      '通过……技术对样本进行处理，获得……组数据。',
      '测量工具采用了……量表，其信度和效度已在先前研究中得到验证。',
      '本研究遵循……方法论，步骤包括……',
      '数据分析采用……模型，以控制潜在的混杂因素。',
      '为确保结果的可靠性，实验重复进行了……次。',
    ],
  },
  results: {
    label: '结果/发现',
    color: 'bg-orange-600',
    items: [
      '实验结果表明，……与……之间存在显著的正相关关系。',
      '数据分析显示，……组的……显著高于……组。',
      '研究发现，……对……具有正向促进作用，效果在……水平上显著。',
      '如表……所示，……的变化趋势与预期假设基本一致。',
      '统计结果显示，……变量对……的解释力达到……%。',
      '从数据中可以观察到，……呈现……的分布特征。',
      '进一步分析表明，……在……条件下表现更为突出。',
      '与已有研究一致，本研究也发现……具有……效应。',
      '值得注意的是，……的影响在……子群体中表现不同。',
      '回归分析结果表明，……是影响……的关键因素。',
      '通过比较发现，……方案在……方面优于传统方法。',
      '总体而言，……的趋势是……，但存在……的波动。',
      '经过……个月的追踪，……变化显著，证实了……的长期效果。',
    ],
  },
  conclusion: {
    label: '讨论/结论',
    color: 'bg-purple-600',
    items: [
      '本研究证实了……，为……提供了新的经验证据。',
      '综上所述，……是……的重要驱动因素，其机制可能涉及……',
      '本文的主要贡献在于……，丰富了……领域的理论体系。',
      '这些发现对……实践具有重要启示，建议……',
      '本研究也存在一定局限性。首先，……；其次，……',
      '未来研究可以从……角度进一步探索……的原因。',
      '尽管研究结果支持……，但在推广时需注意……的差异。',
      '本研究的理论贡献在于……，实践贡献在于……',
      '对比已有研究成果，本文在……方面有所突破。',
      '结论表明，……策略可以有效改善……，值得推广应用。',
      '需要指出的是，本研究仅关注了……，其他因素有待后续考察。',
      '展望未来，……方向可能成为该领域的研究前沿。',
      '本研究为……领域提供了新的视角，拓展了……的研究边界。',
    ],
  },
}

export default function PhrasesPage() {
  const [activeTab, setActiveTab] = useState('introduction')
  const current = phrasesData[activeTab]

  return (
    <WritingPageLayout
      title="常用学术句式模板库"
      description="涵盖引言、方法、结果、结论四类共 50+ 条学术写作常用句式，点击「复制」即可粘贴到论文中。"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* 左侧分类标签 */}
        <div className="sm:w-40 flex-shrink-0">
          <nav className="sm:sticky sm:top-4 flex sm:flex-col gap-1.5">
            {Object.entries(phrasesData).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150
                  ${activeTab === key
                    ? `${cat.color} text-white shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {cat.label}
                <span className={`ml-1.5 text-xs opacity-75`}>
                  ({cat.items.length})
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 右侧句式列表 */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2.5">
            {current.items.map((phrase, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 hover:border-gray-300 hover:shadow-sm transition-all duration-150"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed">
                  {phrase}
                </p>
                <CopyButton text={phrase} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          {/* 使用提示 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600 leading-relaxed">
              提示：句式中的「……」为占位符，使用时请替换为你的具体内容。句式仅供参照，建议根据实际写作需求进行调整。
            </p>
          </div>
        </div>
      </div>
    </WritingPageLayout>
  )
}
