import { useState } from 'react'
import WritingPageLayout, { CopyButton } from '../components/WritingPageLayout'

// ── 格式生成规则 ──
function generateCitation(data, format) {
  const { authors, title, type, journalName, year, volume, issue, pages, doi } = data

  const authorList = authors.split(/[,，]/).map(s => s.trim()).filter(Boolean)

  switch (format) {
    // ─── GB/T 7714 ───
    case 'gbt': {
      const authorStr = authorList.join(', ') + '.'
      let base = `${authorStr} ${title}`
      switch (type) {
        case 'journal': {
          base += `[J]. ${journalName}, ${year}`
          if (volume) base += `, ${volume}`
          if (issue) base += `(${issue})`
          if (pages) base += `: ${pages}`
          break
        }
        case 'book': {
          base += `[M].`
          if (journalName) base += ` ${journalName}`
          base += `, ${year}`
          if (pages) base += `: ${pages}`
          break
        }
        case 'thesis': {
          base += `[D]. ${journalName}, ${year}`
          break
        }
        case 'webpage': {
          base += `[EB/OL]. ${journalName}, ${year}`
          break
        }
      }
      if (doi) base += `. DOI: ${doi}`
      return base + '.'
    }

    // ─── APA ───
    case 'apa': {
      const engAuthors = authorList.map(name => {
        // 简单转换为英文格式：首字母大写拼音
        return name
      })
      let authorStr
      if (engAuthors.length === 1) {
        authorStr = engAuthors[0]
      } else if (engAuthors.length === 2) {
        authorStr = engAuthors.join(', & ')
      } else if (engAuthors.length > 2) {
        authorStr = engAuthors.slice(0, -1).join(', ') + ', & ' + engAuthors[engAuthors.length - 1]
      } else {
        authorStr = ''
      }
      let base = `${authorStr} (${year}). ${title}.`
      switch (type) {
        case 'journal': {
          base += ` ${journalName}`
          if (volume) base += `, ${volume}`
          if (issue) base += `(${issue})`
          if (pages) base += `, ${pages}`
          break
        }
        case 'book': {
          if (journalName) base += ` ${journalName}.`
          if (pages) base += ` ${pages}.`
          break
        }
        case 'thesis': {
          base += ` ${journalName}.`
          break
        }
        case 'webpage': {
          base += ` ${journalName}.`
          break
        }
      }
      if (doi) base += ` https://doi.org/${doi}`
      return base
    }

    // ─── MLA ───
    case 'mla': {
      let authorStr
      if (authorList.length === 1) {
        authorStr = authorList[0]
      } else if (authorList.length === 2) {
        authorStr = authorList.join(' and ')
      } else if (authorList.length > 2) {
        authorStr = authorList[0] + ', et al.'
      } else {
        authorStr = ''
      }
      let base = `${authorStr}. "${title}." ${journalName}`
      if (volume) base += `, vol. ${volume}`
      if (issue) base += `, no. ${issue}`
      base += `, ${year}`
      if (pages) base += `, pp. ${pages}`
      if (doi) base += `. doi:${doi}`
      return base + '.'
    }

    default:
      return ''
  }
}

// ── 必填校验 ──
function validate(data) {
  const errors = []
  if (!data.authors.trim()) errors.push('作者不能为空')
  if (!data.title.trim()) errors.push('标题不能为空')
  if (!data.year.trim()) errors.push('年份不能为空')
  if (!data.journalName.trim()) {
    const labels = { journal: '期刊名称', book: '出版社', thesis: '学校名称', webpage: '网站名称' }
    errors.push(`${labels[data.type] || '来源'}不能为空`)
  }
  return errors
}

const typeLabels = {
  journal: '期刊文章 [J]',
  book: '图书 [M]',
  thesis: '学位论文 [D]',
  webpage: '网页 [EB/OL]',
}

const typePlaceholders = {
  journal: '期刊名称',
  book: '出版社名称',
  thesis: '学校名称',
  webpage: '网站名称',
}

const formatLabels = {
  gbt: 'GB/T 7714',
  apa: 'APA (第7版)',
  mla: 'MLA (第9版)',
}

export default function ReferenceGenerator() {
  const [form, setForm] = useState({
    authors: '',
    title: '',
    type: 'journal',
    journalName: '',
    year: '',
    volume: '',
    issue: '',
    pages: '',
    doi: '',
  })
  const [format, setFormat] = useState('gbt')
  const [result, setResult] = useState('')
  const [errors, setErrors] = useState([])

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors([])
  }

  const handleGenerate = () => {
    const errs = validate(form)
    if (errs.length > 0) {
      setErrors(errs)
      setResult('')
      return
    }
    setErrors([])
    const citation = generateCitation(form, format)
    setResult(citation)
  }

  const showVolumeIssue = form.type === 'journal'
  const showPages = form.type !== 'webpage'

  return (
    <WritingPageLayout
      title="参考文献格式生成器"
      description="填写文献信息，一键生成符合学术规范的引用条目。支持 GB/T 7714 / APA / MLA 三种格式。"
    >
      {/* 表单 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 作者 */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              作者 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.authors}
              onChange={e => update('authors', e.target.value)}
              placeholder="多个作者用逗号分隔，如：张三, 李四"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* 标题 */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="论文/图书/学位论文标题"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* 文献类型 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">文献类型</label>
            <select
              value={form.type}
              onChange={e => update('type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            >
              {Object.entries(typeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* 来源名称 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {typePlaceholders[form.type]} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.journalName}
              onChange={e => update('journalName', e.target.value)}
              placeholder={typePlaceholders[form.type]}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* 年份 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              年份 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.year}
              onChange={e => update('year', e.target.value)}
              placeholder="如：2023"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          {/* 卷（仅期刊） */}
          {showVolumeIssue && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">卷（可选）</label>
                <input
                  type="text"
                  value={form.volume}
                  onChange={e => update('volume', e.target.value)}
                  placeholder="如：12"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">期（可选）</label>
                <input
                  type="text"
                  value={form.issue}
                  onChange={e => update('issue', e.target.value)}
                  placeholder="如：3"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          {/* 页码（非网页） */}
          {showPages && (
            <div className={showVolumeIssue ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">页码（可选）</label>
              <input
                type="text"
                value={form.pages}
                onChange={e => update('pages', e.target.value)}
                placeholder="如：45-50"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          {/* DOI */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">DOI（可选）</label>
            <input
              type="text"
              value={form.doi}
              onChange={e => update('doi', e.target.value)}
              placeholder="如：10.1234/example.1"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* 格式选择 + 生成按钮 */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
          >
            {Object.entries(formatLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
          >
            生成引用
          </button>
        </div>

        {/* 错误提示 */}
        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-red-600">• {e}</p>
            ))}
          </div>
        )}
      </div>

      {/* 结果展示 */}
      {result && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              引用结果 · {formatLabels[format]}
            </h3>
            <CopyButton text={result} />
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-gray-800 leading-relaxed break-words font-serif">
              {result}
            </p>
          </div>
        </div>
      )}

      {/* 格式预览提示 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="text-xs font-semibold text-gray-600 mb-2">格式预览</h4>
        <div className="space-y-2 text-xs text-gray-500">
          <p><span className="font-medium text-gray-700">GB/T 7714：</span>张三, 李四. 论文标题[J]. 期刊名称, 2023, 12(3): 45-50.</p>
          <p><span className="font-medium text-gray-700">APA：</span>Zhang, S., & Li, S. (2023). 论文标题. 期刊名称, 12(3), 45-50.</p>
          <p><span className="font-medium text-gray-700">MLA：</span>张三, and 李四. "论文标题." 期刊名称, vol. 12, no. 3, 2023, pp. 45-50.</p>
        </div>
      </div>
    </WritingPageLayout>
  )
}
