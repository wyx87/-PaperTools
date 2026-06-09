// ── 百度 OCR 手写识别服务 ──
let tokenCache = { access_token: null, expiresAt: 0 }

async function getAccessToken(apiKey, secretKey) {
  if (tokenCache.access_token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.access_token
  }
  const resp = await fetch(
    `/api/baidu-ocr/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
  )
  const data = await resp.json()
  if (data.error) throw new Error(data.error_description || '获取百度token失败，请检查API Key')
  tokenCache.access_token = data.access_token
  tokenCache.expiresAt = Date.now() + (data.expires_in - 300) * 1000
  return data.access_token
}

export async function recognizeHandwriting(imageBase64, apiKey, secretKey) {
  const token = await getAccessToken(apiKey, secretKey)
  const base64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
  const resp = await fetch(`/api/baidu-ocr/rest/2.0/ocr/v1/handwriting?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `image=${encodeURIComponent(base64)}&language_type=CHN_ENG&detect_direction=true&paragraph=true`
  })
  const data = await resp.json()
  if (data.error_code) throw new Error(`百度OCR ${data.error_code}: ${data.error_msg}`)
  const words = (data.words_result || []).map(w => w.words)
  const text = words.join('\n')
  const confidence = words.length > 0 && data.words_result.some(w => w.probability != null)
    ? Math.round(data.words_result.reduce((s, w) => s + (w.probability?.average || w.probability || 0.8) * 100, 0) / words.length)
    : null
  return { text, confidence, raw: data }
}

// 通用高精度识别：自动处理中文/英文/印刷/手写混合
export async function recognizeAuto(imageBase64, apiKey, secretKey) {
  const token = await getAccessToken(apiKey, secretKey)
  const base64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64
  const resp = await fetch(`/api/baidu-ocr/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `image=${encodeURIComponent(base64)}&language_type=auto_detect&detect_direction=true&paragraph=true&probability=true`
  })
  const data = await resp.json()
  if (data.error_code) throw new Error(`百度OCR ${data.error_code}: ${data.error_msg}`)
  const words = (data.words_result || []).map(w => w.words)
  const text = words.join('\n')
  const confidence = words.length > 0
    ? Math.round(data.words_result.reduce((s, w) => s + (w.probability?.average || w.probability || 0.8) * 100, 0) / words.length)
    : null
  return { text, confidence, raw: data }
}
