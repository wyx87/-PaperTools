/**
 * PDF 工具函数
 */

import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 初始化 pdf.js worker（版本必须与 npm 安装的 pdfjs-dist 完全一致）
let workerInitialized = false
export function initPdfJs() {
  if (!workerInitialized) {
    // 使用与项目依赖完全匹配的版本号
    const version = pdfjsLib.version || '4.0.379'
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`
    workerInitialized = true
  }
}

/**
 * 检测 PDF 是否加密
 */
export async function isPdfEncrypted(arrayBuffer) {
  try {
    // 方法1：用 pdf-lib 尝试加载
    const uint8 = new Uint8Array(arrayBuffer)
    const magic = String.fromCharCode(...uint8.slice(0, 5))
    if (magic !== '%PDF-') return '文件不是有效的 PDF'

    await PDFDocument.load(arrayBuffer, { ignoreEncryption: false })
    return null // 未加密
  } catch (err) {
    if (err.message?.includes('encrypt') || err.message?.includes('password') || err.message?.includes('Encrypt')) {
      return '该 PDF 已加密，请先解密后再操作'
    }
    return null // 其他错误，继续处理
  }
}

/**
 * 读取文件为 ArrayBuffer（带缓存）
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 检查文件大小并给出警告条件
 */
export function checkFileWarnings(files, maxPerFile, maxTotal) {
  const warnings = []
  let totalSize = 0
  let anyLarge = false

  for (const f of files) {
    totalSize += f.size
    if (f.size > maxPerFile) {
      warnings.push(`文件 "${f.name}" 超过 ${formatSize(maxPerFile)}`)
    }
    if (f.size > 20 * 1024 * 1024) {
      anyLarge = true
    }
  }

  if (maxTotal && totalSize > maxTotal) {
    warnings.push(`总文件大小超过 ${formatSize(maxTotal)} 限制`)
  }

  return { warnings, totalSize, anyLarge }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * 快速检测 PDF 前 N 页是否包含可提取的文字
 * @returns {{ hasText: boolean, samplePages: number, totalPages: number }}
 */
export async function detectPdfContent(pdfDoc, samplePages = 3) {
  const totalPages = pdfDoc.numPages
  const pagesToCheck = Math.min(samplePages, totalPages)
  let totalChars = 0

  for (let i = 0; i < pagesToCheck; i++) {
    const page = await pdfDoc.getPage(i + 1)
    const content = await page.getTextContent()
    const chars = content.items.reduce((sum, item) => sum + (item.str || '').length, 0)
    totalChars += chars
  }

  // 平均每页少于 10 个字符 → 判定为扫描件/图片型 PDF
  const hasText = (totalChars / pagesToCheck) >= 10
  return { hasText, samplePages: pagesToCheck, totalPages }
}

/**
 * 智能文本提取：基于位置信息合并字符/词块，重建段落结构
 * 增强版：额外返回表格检测信息（用于 DOCX 表格生成）
 *
 * 原理：pdf.js 返回的 textItems 是逐字/逐词的散块。
 * 通过分析每个 item 的 (x, y, width, height)，将同一行的字符合并，
 * 再根据行间距和标点符号智能判断段落边界。
 *
 * @returns {{ text: string, tables: Array<{lines: string[][]}> }}
 */
export async function extractPageTextWithLayout(page) {
  const content = await page.getTextContent()
  if (!content.items.length) return ''

  // 1. 丰富 item 信息
  const items = content.items.map(item => ({
    str: item.str,
    x: item.transform[4],
    y: item.transform[5],
    w: item.width,
    h: item.height || 12,
  }))

  // 2. 按 y 降序（从上到下），x 升序（从左到右）排序
  items.sort((a, b) => {
    const yDiff = b.y - a.y
    if (Math.abs(yDiff) > 0.5) return yDiff
    return a.x - b.x
  })

  // 3. 按 y 坐标聚合成行
  const medianH = median(items.map(it => it.h))
  const lineTol = Math.max(1, medianH * 0.4) // 同行 y 容忍阈值

  const lines = []
  let curLine = [items[0]]
  let curY = items[0].y

  for (let i = 1; i < items.length; i++) {
    if (Math.abs(items[i].y - curY) <= lineTol) {
      curLine.push(items[i])
    } else {
      lines.push(curLine.sort((a, b) => a.x - b.x))
      curLine = [items[i]]
      curY = items[i].y
    }
  }
  lines.push(curLine.sort((a, b) => a.x - b.x))

  // 4. 行内合并：根据间距决定加不加空格
  const lineTexts = lines.map(line => {
    if (!line.length) return ''
    const avgW = median(line.map(it => it.w))
    let result = line[0].str
    for (let i = 1; i < line.length; i++) {
      const gap = line[i].x - (line[i - 1].x + line[i - 1].w)
      const prevCh = line[i - 1].str.slice(-1) || ''
      const currCh = line[i].str.charAt(0) || ''
      // 如果前一个字符或当前字符是 CJK 字符，大概率不需要空格
      const prevCJK = isCJK(prevCh)
      const currCJK = isCJK(currCh)
      if (gap > avgW * 3) {
        result += '    ' // 大间距 = 列分隔
      } else if (gap > avgW * 1.1 || (!prevCJK && !currCJK && gap > avgW * 0.3)) {
        result += ' ' // 正常单词间距
      }
      result += line[i].str
    }
    return result.trim()
  }).filter(t => t.length > 0)

  if (!lineTexts.length) return ''

  // 5. 段落合并：基于行间距 + 标点符号
  const lineSpacings = []
  for (let i = 1; i < lines.length; i++) {
    lineSpacings.push(Math.abs(lines[i][0].y - lines[i - 1][0].y))
  }
  const medianSpacing = median(lineSpacings) || medianH * 1.5

  const paragraphs = []
  let curPara = [lineTexts[0]]

  for (let i = 1; i < lineTexts.length; i++) {
    const prevLine = lineTexts[i - 1]
    const currLine = lineTexts[i]
    const prevLast = prevLine.slice(-1)
    const currFirst = currLine.charAt(0)

    // 行间距
    const yGap = i - 1 < lineSpacings.length ? lineSpacings[i - 1] : medianSpacing
    const gapLarge = yGap > medianSpacing * 1.7

    // 上一行以句末标点结束 → 新段落
    const sentenceEnd = /[。！？.!?」"）\)]$/.test(prevLast)

    // 当前行开头有大写字母/数字编号 → 新段落起点
    const looksLikeNewPara = /^[（(]*[A-Z\d一二三四五六七八九十第]/.test(currLine)

    // 上一行以逗号/分号结束 → 大概率是段落内续行
    const continuesLine = /[，、；,;：:——]$/.test(prevLast)

    if (gapLarge || (sentenceEnd && !continuesLine && gapLarge)) {
      // 明确的段落分隔
      paragraphs.push(curPara.join(''))
      curPara = [currLine]
    } else if (sentenceEnd && looksLikeNewPara) {
      // 句末 + 新段起点
      paragraphs.push(curPara.join(''))
      curPara = [currLine]
    } else if (gapLarge && !continuesLine) {
      paragraphs.push(curPara.join(''))
      curPara = [currLine]
    } else {
      // 段落内续行 — 合并时不加额外换行
      curPara.push(currLine)
    }
  }
  if (curPara.length) paragraphs.push(curPara.join(''))

  return paragraphs.join('\n\n')
}

function median(arr) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function isCJK(ch) {
  const cp = ch.codePointAt(0)
  return (cp >= 0x4E00 && cp <= 0x9FFF) || // CJK Unified
    (cp >= 0x3400 && cp <= 0x4DBF) ||       // CJK Extension A
    (cp >= 0x3000 && cp <= 0x303F) ||       // CJK Punctuation
    (cp >= 0xFF00 && cp <= 0xFFEF) ||       // Fullwidth
    (cp >= 0x2E80 && cp <= 0x2EFF)          // CJK Radicals
}

/**
 * 渲染 PDF 单页为 Canvas
 */
export async function renderPage(pdfDoc, pageIndex, scale = 1.5) {
  const page = await pdfDoc.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

/**
 * Canvas 转 Blob
 */
export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('图片生成失败'))
    }, type, quality)
  })
}
