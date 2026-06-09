import { useState, useRef } from 'react'
import { Settings, Palette, Grid3X3, AlignLeft, Type, RotateCw, Eye, EyeOff, ChevronDown, Pipette, Undo2 } from 'lucide-react'
import { colorThemes } from './ChartDataInput'

const CHART_WIDTHS = ['100%', '90%', '80%', '70%', '600px', '500px', '400px']
const CHART_HEIGHTS = [400, 350, 300, 450, 500, 550, 600]
const BG_OPTIONS = [
  { id: 'white', label: '白色', value: '#FFFFFF' },
  { id: 'lightgray', label: '浅灰', value: '#F3F4F6' },
  { id: 'transparent', label: '透明', value: 'transparent' },
]
const LEGEND_POSITIONS = [
  { id: 'bottom', label: '底部' },
  { id: 'top', label: '顶部' },
  { id: 'left', label: '左侧' },
  { id: 'right', label: '右侧' },
  { id: 'none', label: '隐藏' },
]
const LABEL_ROTATIONS = [0, 30, 45, 90]
const VALUE_FONT_SIZES = [10, 11, 12, 13, 14]

const defaultSettings = {
  chartWidth: '100%',
  chartHeight: 400,
  background: 'white',
  showGridX: true,
  showGridY: true,
  legendPos: 'bottom',
  xLabelRotate: 0,
  showValueLabel: false,
  valueFontSize: 11,
  titleText: '',
  titlePos: 'center',
  xAxisName: '',
  yAxisName: '',
  axisFontSize: 11,
  themeId: 'blue',
  uniformColor: false,
  uniformColorValue: '#3B82F6',
  customColors: null,
}

export { defaultSettings }

const comboTypes = [
  { id: 'bar-line', label: '柱状 + 折线', s1: 'bar', s2: 'line' },
  { id: 'bar-area', label: '柱状 + 面积', s1: 'bar', s2: 'line' },
  { id: 'double-bar', label: '双柱状', s1: 'bar', s2: 'bar' },
  { id: 'double-line', label: '双折线', s1: 'line', s2: 'line' },
  { id: 'line-area', label: '折线 + 面积', s1: 'line', s2: 'line' },
  { id: 'bar-line-area', label: '柱+折+面积', s1: 'bar', s2: 'line' },
]

export { comboTypes }

function ColorSwatch({ color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-md border-2 transition-all flex-shrink-0 cursor-pointer hover:scale-110 hover:shadow-md ${active ? 'border-[#1E3A5F] scale-110 shadow-md ring-2 ring-[#3B82F6]/30' : 'border-gray-200'}`}
      style={{ background: color }}
      title={color}
    />
  )
}

export default function ChartControlPanel({ settings, onChange, showComboTypes = false, comboType, onComboTypeChange }) {
  const [expanded, setExpanded] = useState(false)
  const [editingColorIdx, setEditingColorIdx] = useState(null)
  const colorInputRef = useRef(null)
  const s = { ...defaultSettings, ...settings }

  const update = (key, value) => onChange({ ...s, [key]: value })

  const theme = colorThemes.find(t => t.id === s.themeId) || colorThemes[0]
  const displayColors = s.customColors || theme.colors

  const handleThemeSelect = (themeId) => {
    onChange({ ...s, themeId, customColors: null })
  }

  const handleCustomColorChange = (index, newColor) => {
    const base = s.customColors || [...theme.colors]
    const updated = [...base]
    updated[index] = newColor
    onChange({ ...s, customColors: updated })
  }

  const handleResetColors = () => {
    onChange({ ...s, customColors: null })
  }

  const openColorPicker = (idx) => {
    setEditingColorIdx(idx)
    setTimeout(() => colorInputRef.current?.click(), 50)
  }

  const hasCustomColors = s.customColors !== null

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-700">图表参数设置</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          {/* ---- Combo type selector ---- */}
          {showComboTypes && comboTypes && onComboTypeChange && (
            <Section icon={Grid3X3} label="组合类型">
              <div className="flex flex-wrap gap-1.5">
                {comboTypes.map(ct => (
                  <button key={ct.id} onClick={() => onComboTypeChange(ct.id)}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                      comboType === ct.id ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {ct.label}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ---- Color scheme (ENHANCED) ---- */}
          <Section icon={Palette} label="颜色方案">
            {/* Theme palette buttons */}
            <div className="flex flex-wrap gap-1">
              {colorThemes.map(ct => (
                <button key={ct.id} onClick={() => handleThemeSelect(ct.id)}
                  className={`px-2 py-1 text-[10px] rounded-md font-medium flex items-center gap-1 transition-colors ${
                    s.themeId === ct.id && !hasCustomColors
                      ? 'ring-2 ring-[#3B82F6] bg-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  <span className="flex gap-0.5">{ct.colors.slice(0, 3).map((c, i) =>
                    <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  )}</span>
                  {ct.name}
                </button>
              ))}
            </div>

            {/* Individual color swatches with pickers */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <Pipette size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-[10px] text-gray-500 mr-1">点击色块自定义：</span>
              {displayColors.map((color, i) => (
                <ColorSwatch
                  key={i}
                  color={color}
                  active={hasCustomColors && i === editingColorIdx}
                  onClick={() => openColorPicker(i)}
                />
              ))}
              <input
                ref={colorInputRef}
                type="color"
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                value={displayColors[editingColorIdx] || '#3B82F6'}
                onChange={(e) => {
                  if (editingColorIdx !== null) {
                    handleCustomColorChange(editingColorIdx, e.target.value)
                  }
                }}
              />
              {hasCustomColors && displayColors.length > 0 && (
                <div className="flex items-center gap-1 ml-1">
                  <input
                    type="text"
                    value={displayColors[0]}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') {
                        handleCustomColorChange(0, v || '#000000')
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value
                      if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
                        handleCustomColorChange(0, '#3B82F6')
                      }
                    }}
                    className="w-[72px] text-[10px] border border-gray-200 rounded px-1.5 py-0.5 font-mono outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    placeholder="#RRGGBB"
                  />
                </div>
              )}
            </div>

            {/* Reset colors button */}
            {hasCustomColors && (
              <button
                onClick={handleResetColors}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-[#3B82F6] hover:text-[#2563EB] font-medium"
              >
                <Undo2 size={10} />恢复默认主题颜色
              </button>
            )}

            {/* Unified color toggle */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={s.uniformColor} onChange={e => update('uniformColor', e.target.checked)}
                  className="w-3 h-3 rounded accent-[#3B82F6]" />
                <span className="text-[10px] text-gray-500">统一颜色</span>
              </label>
              {s.uniformColor && (
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={s.uniformColorValue || '#3B82F6'}
                    onChange={e => update('uniformColorValue', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-gray-200 p-0"
                  />
                  <input
                    type="text"
                    value={s.uniformColorValue || '#3B82F6'}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') {
                        update('uniformColorValue', v || '#000000')
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value
                      if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
                        update('uniformColorValue', '#3B82F6')
                      }
                    }}
                    className="w-[72px] text-[10px] border border-gray-200 rounded px-1.5 py-0.5 font-mono outline-none focus:ring-1 focus:ring-[#3B82F6]"
                    placeholder="#RRGGBB"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* ---- Chart size ---- */}
          <Section icon={Grid3X3} label="图表尺寸">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">宽度</span>
                <select value={s.chartWidth} onChange={e => update('chartWidth', e.target.value)}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                  {CHART_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">高度</span>
                <select value={s.chartHeight} onChange={e => update('chartHeight', Number(e.target.value))}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                  {CHART_HEIGHTS.map(h => <option key={h} value={h}>{h}px</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">背景</span>
                <select value={s.background} onChange={e => update('background', e.target.value)}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                  {BG_OPTIONS.map(bg => <option key={bg.id} value={bg.id}>{bg.label}</option>)}
                </select>
              </label>
            </div>
          </Section>

          {/* ---- Grid ---- */}
          <Section icon={Grid3X3} label="网格线">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={s.showGridX} onChange={e => update('showGridX', e.target.checked)} className="w-3 h-3 accent-[#3B82F6]" />
                <span className="text-[10px] text-gray-600">X轴网格</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={s.showGridY} onChange={e => update('showGridY', e.target.checked)} className="w-3 h-3 accent-[#3B82F6]" />
                <span className="text-[10px] text-gray-600">Y轴网格</span>
              </label>
            </div>
          </Section>

          {/* ---- Legend ---- */}
          <Section icon={AlignLeft} label="图例位置">
            <div className="flex flex-wrap gap-1.5">
              {LEGEND_POSITIONS.map(lp => (
                <button key={lp.id} onClick={() => update('legendPos', lp.id)}
                  className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                    s.legendPos === lp.id ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{lp.label}</button>
              ))}
            </div>
          </Section>

          {/* ---- X-axis labels ---- */}
          <Section icon={RotateCw} label="X轴标签">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-gray-500">旋转：</span>
              {LABEL_ROTATIONS.map(r => (
                <button key={r} onClick={() => update('xLabelRotate', r)}
                  className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                    s.xLabelRotate === r ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{r}°</button>
              ))}
            </div>
          </Section>

          {/* ---- Value labels ---- */}
          <Section icon={Type} label="数值标签">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={s.showValueLabel} onChange={e => update('showValueLabel', e.target.checked)} className="w-3 h-3 accent-[#3B82F6]" />
              <span className="text-[10px] text-gray-600">显示数值</span>
            </label>
            {s.showValueLabel && (
              <label className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-500">字号</span>
                <select value={s.valueFontSize} onChange={e => update('valueFontSize', Number(e.target.value))}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                  {VALUE_FONT_SIZES.map(fs => <option key={fs} value={fs}>{fs}px</option>)}
                </select>
              </label>
            )}
          </Section>

          {/* ---- Titles & axis names ---- */}
          <Section icon={Type} label="标题与轴名">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10">标题</span>
                <input type="text" value={s.titleText} onChange={e => update('titleText', e.target.value)}
                  placeholder="图表标题" className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#3B82F6]" />
                <select value={s.titlePos} onChange={e => update('titlePos', e.target.value)}
                  className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white">
                  <option value="center">居中</option>
                  <option value="left">居左</option>
                  <option value="right">居右</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10">X轴名</span>
                <input type="text" value={s.xAxisName} onChange={e => update('xAxisName', e.target.value)}
                  placeholder="X轴名称" className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#3B82F6]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-10">Y轴名</span>
                <input type="text" value={s.yAxisName} onChange={e => update('yAxisName', e.target.value)}
                  placeholder="Y轴名称" className="flex-1 text-[10px] border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#3B82F6]" />
              </div>
              <label className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">轴名字号</span>
                <select value={s.axisFontSize} onChange={e => update('axisFontSize', Number(e.target.value))}
                  className="text-[10px] border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                  {VALUE_FONT_SIZES.map(fs => <option key={fs} value={fs}>{fs}px</option>)}
                </select>
              </label>
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}

function Section({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-gray-400" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}
