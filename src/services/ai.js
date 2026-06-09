// AI 服务层 — 后端代理始终可用（Vite proxy /api → 后端），用户 Key 为可选回退

const API_BASE = 'https://api.deepseek.com/v1';
const MODEL = 'deepseek-chat';

function getApiKey() {
  try {
    return localStorage.getItem('paper_toolbox_api_key') || '';
  } catch {
    return '';
  }
}

export function setApiKey(key) {
  try {
    localStorage.setItem('paper_toolbox_api_key', key.trim());
  } catch { /* ignore */ }
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

export function getStoredApiKey() {
  return getApiKey();
}

// 后端代理始终通过 Vite proxy 或同源访问，无需手动配置地址
const BACKEND_URL = '';

// ========== 核心调用 ==========

async function callDeepSeek(messages, temperature = 0.7, maxTokens = 4096) {
  const userKey = getApiKey();

  // 如果用户提供了自己的 Key，直接调 DeepSeek
  if (userKey) {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userKey}`,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: maxTokens, stream: false }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('API Key 无效，请检查');
      if (res.status === 402) throw new Error('账户余额不足');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后再试');
      throw new Error(err.error?.message || `请求失败 (${res.status})`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  // 后端代理（Vite proxy /api → 后端，或同源访问）
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature, maxTokens }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'AI 服务暂不可用，请稍后重试');
  }

  const data = await res.json();
  return data.content;
}

// 流式调用
export async function* streamDeepSeek(messages, temperature = 0.7, maxTokens = 4096) {
  const userKey = getApiKey();

  const url = userKey
    ? `${API_BASE}/chat/completions`
    : `${BACKEND_URL}/api/ai/chat/stream`;

  const headers = {
    'Content-Type': 'application/json',
    ...(userKey ? { Authorization: `Bearer ${userKey}` } : {}),
  };

  const body = JSON.stringify({
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  if (userKey) {
    // 直接调 DeepSeek stream
    const res = await fetch(url, { method: 'POST', headers, body });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('API Key 无效，请检查');
      if (res.status === 402) throw new Error('账户余额不足');
      throw new Error(err.error?.message || `请求失败 (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch { /* skip */ }
      }
    }
  } else {
    // 走后端代理 SSE
    const res = await fetch(url, { method: 'POST', headers, body });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'AI 服务暂不可用');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.content) yield parsed.content;
        } catch (e) {
          if (e.message && !e.message.startsWith('Unexpected')) throw e;
        }
      }
    }
  }
}

// ============= 论文工具方法 =============

// ========== 本地备用函数（无需API Key） ==========
// 当没有 API Key 时使用本地基础文本处理

function basicPolish(text, style) {
  // 简单的本地替换规则
  let result = text
    .replace(/但是/g, '然而')
    .replace(/所以/g, '因此')
    .replace(/而且/g, '此外')
    .replace(/很/g, '非常')
    .replace(/好多/g, '众多')
    .replace(/搞/g, '进行')
    .replace(/弄/g, '处理')
    .replace(/我们/g, '本研究')
    .replace(/觉得/g, '认为')
    .replace(/吧/g, '')
    .replace(/吗/g, '')
    .replace(/么/g, '')
    .replace(/哈/g, '');

  if (style === '更简洁') {
    result = result.replace(/的/g, '之');
  }
  return `【本地基础润色·${style}】\n\n${result}\n\n⚠️ 提示：配置 DeepSeek API Key 可获得专业AI润色效果。（免费注册 deepseek.com）`;
}

function basicRephrase(text, count) {
  const versions = [];
  // 基础改述策略
  const strategies = [
    (t) => t.replace(/本研究/g, '本文').replace(/提出/g, '引入了').replace(/方法/g, '方案'),
    (t) => t.replace(/实验/g, '实证研究').replace(/数据/g, '资料').replace(/分析/g, '剖析'),
    (t) => t.replace(/表明/g, '证实').replace(/提升/g, '改善').replace(/优于/g, '胜过'),
  ];
  for (let i = 0; i < Math.min(count, strategies.length); i++) {
    versions.push(`版本${i + 1}：${strategies[i](text)}`);
  }
  return `【本地基础降重·${count}个版本】\n\n${versions.join('\n\n')}\n\n⚠️ 提示：配置 DeepSeek API Key 可获得专业降重效果。`;
}

function basicGrammarCheck(text) {
  const issues = [];
  const lines = text.split(/[。！？]/);
  for (const line of lines) {
    if (line.includes('的的')) issues.push(`重复"的"字："${line.slice(0, 30)}..."`);
    if (line.includes('了了')) issues.push(`重复"了"字："${line.slice(0, 30)}..."`);
    if (line.includes('我们')) issues.push(`建议"我们"改为"本研究"："${line.slice(0, 30)}..."`);
  }
  if (issues.length === 0) {
    return `【本地基础纠错】\n\n未发现明显基础语法问题。\n\n⚠️ 提示：配置 DeepSeek API Key 可获得深度AI语法纠错。`;
  }
  return `【本地基础纠错】\n发现 ${issues.length} 个问题：\n\n${issues.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n⚠️ 提示：配置 DeepSeek API Key 可获得深度AI语法纠错。`;
}

function basicTranslate(text, direction) {
  if (direction === 'zh2en') {
    return `[Local Basic Translation]\n\n${text}\n\n⚠️ Configure an API Key for professional translation.`;
  }
  return `【本地基础翻译】\n\n${text}\n\n⚠️ 请配置 DeepSeek API Key 以获得专业翻译效果。`;
}

// ========== 导出函数（后端代理优先，调用失败自动降级） ==========

export async function polishText(text, style = '学术化') {
  const prompts = {
    '学术化': '请将以下文本润色为更正式的学术风格，保持原意不变，提升语言的学术性和专业性：',
    '更简洁': '请将以下文本精简，去除冗余表达，使其更简洁有力，保持学术风格：',
    '更流畅': '请改善以下文本的流畅度和逻辑连贯性，使其读起来更自然：',
    '英文润色': 'Please polish the following academic text to sound more professional and native-like:',
  };
  const msg = prompts[style] || prompts['学术化'];
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位专业的学术论文编辑，擅长改写和润色学术文本。请直接输出润色后的文本，不要多加解释。' },
      { role: 'user', content: `${msg}\n\n${text}` },
    ], 0.5);
  } catch {
    return basicPolish(text, style);
  }
}

export async function rephraseText(text, count = 3) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位学术写作专家，擅长用不同方式表达同一意思，帮助降重。请直接输出结果。' },
      { role: 'user', content: `请对以下文本进行 ${count} 种不同的改写，每种改写保持原意但用不同的表达方式、句式、词汇。请在每种改写前标注"版本1""版本2"等：\n\n${text}` },
    ], 0.8, 4096);
  } catch {
    return basicRephrase(text, count);
  }
}

export async function checkGrammar(text) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位中文语法专家和编辑。请逐句检查文本中的语法错误、标点错误、用词不当，并给出修正建议。如果文本无错误，也请明确说明。' },
      { role: 'user', content: `请检查以下文本的语法和用词问题：\n\n${text}` },
    ], 0.3);
  } catch {
    return basicGrammarCheck(text);
  }
}

export async function translateText(text, direction = 'zh2en') {
  const systemPrompts = {
    'zh2en': '你是一位专业学术翻译，请将中文翻译为地道的英文学术语言。直接输出英文翻译。',
    'en2zh': '你是一位专业学术翻译，请将英文翻译为准确的中文学术语言。直接输出中文翻译。',
  };
  try {
    return await callDeepSeek([
      { role: 'system', content: systemPrompts[direction] },
      { role: 'user', content: text },
    ], 0.3);
  } catch {
    return basicTranslate(text, direction);
  }
}

export async function generateAbstract(text, style = '结构化') {
  const prompts = {
    '结构化': '请生成结构化摘要，包含：研究背景、研究目的、研究方法、主要发现、研究结论五个部分。',
    '单段式': '请生成一段式摘要（约200-300字），概括研究背景、方法、主要发现和结论。',
    '英文摘要': 'Please generate an English abstract (about 200-300 words) summarizing the background, methods, key findings, and conclusions.',
  };
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位学术写作专家，擅长撰写论文摘要。请直接输出摘要内容。' },
      { role: 'user', content: `根据以下内容，${prompts[style]}\n\n原文：\n${text}` },
    ], 0.5, 4096);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n请确保后端服务已启动（node server.js），并在 .env 中配置 DEEPSEEK_API_KEY。`;
  }
}

export async function optimizeTitle(rawTitle, count = 5) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位学术论文标题写作专家。请根据草稿标题生成多个学术风格的标题候选。直接输出结果。' },
      { role: 'user', content: `请根据以下草稿标题，生成 ${count} 个不同风格的学术论文标题候选。可以调整表达方式、突出重点、使用冒号分隔结构等。每个标题单独一行：\n\n原始标题：${rawTitle}` },
    ], 0.8);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n请确保后端服务已启动（node server.js），并在 .env 中配置 DEEPSEEK_API_KEY。`;
  }
}

export async function extractConclusions(discussion) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位学术写作专家，擅长从研究讨论中提炼结论。请直接输出结果。' },
      { role: 'user', content: `请根据以下研究讨论/分析内容，提炼出清晰的研究结论，包括：1）核心发现，2）理论/实践贡献，3）研究局限与未来方向：\n\n${discussion}` },
    ], 0.5, 4096);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n请确保后端服务已启动（node server.js），并在 .env 中配置 DEEPSEEK_API_KEY。`;
  }
}

export async function generateProposal(topic) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位学术研究导师，擅长帮助学生撰写开题报告。请直接输出内容。' },
      { role: 'user', content: `请根据以下研究方向，生成开题报告的要点，包括：研究背景与意义、国内外研究现状、研究目标和内容、拟解决的关键问题、研究方法与技术路线、预期成果与创新点：\n\n研究方向：${topic}` },
    ], 0.6, 4096);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n请确保后端服务已启动（node server.js），并在 .env 中配置 DEEPSEEK_API_KEY。`;
  }
}

export async function reviewSection(text) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位经验丰富的学术审稿人。请以审稿人视角给出建设性的修改建议。直接输出结果。' },
      { role: 'user', content: `请以审稿人视角审阅以下论文段落，给出具体的修改建议，包括：1）逻辑和论证是否存在问题，2）论述是否充分，3）表达是否可以改进，4）是否有需要补充的内容：\n\n${text}` },
    ], 0.5, 4096);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n请确保后端服务已启动（node server.js），并在 .env 中配置 DEEPSEEK_API_KEY。`;
  }
}

// ========== 文字转表格 ==========

export async function textToTableData(text) {
  try {
    const result = await callDeepSeek([
      { role: 'system', content: `你是一位数据处理专家，擅长将自然语言描述转换成结构化的CSV表格。

规则：
1. 第一行必须是表头（用逗号分隔）
2. 后续每行是数据行（用逗号分隔）
3. 如果原文本是纯描述性（如论文中的实验数据描述），请提取关键数值和指标
4. 如果原文本本身就是表格数据，保持原格式
5. 输出严格的CSV格式，不要包含任何解释、前缀、后缀
6. 每个单元格内容用逗号分隔，如果内容本身含逗号，用双引号包裹

示例输入："实验组A准确率92.3%，召回率89.5%；实验组B准确率88.7%，召回率85.2%；实验组C准确率95.1%，召回率93.4%"

示例输出：
方法,准确率,召回率
A,92.3%,89.5%
B,88.7%,85.2%
C,95.1%,93.4%` },
      { role: 'user', content: `请将以下文字描述转换为CSV格式的表格：\n\n${text}` },
    ], 0.3, 4096);
    return result.trim();
  } catch (e) {
    throw new Error(`AI 服务暂不可用：${e.message}`);
  }
}

export async function askQuestion(question) {
  try {
    return await callDeepSeek([
      { role: 'system', content: '你是一位经验丰富的学术写作导师，熟悉论文写作规范、投稿流程、学术写作技巧。请给出专业、具体的回答。' },
      { role: 'user', content: question },
    ], 0.7, 4096);
  } catch (e) {
    return `⚠️ AI 服务暂不可用：${e.message}\n\n基础建议：请确保论文结构完整，包括引言、文献综述、方法、结果、讨论和结论。`;
  }
}

// ========== 图片 OCR（DeepSeek 视觉模型）==========

export async function recognizeImage(base64DataUrl) {
  const userKey = getApiKey();

  const messages = [{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: base64DataUrl } },
      { type: 'text', text: '请识别这张图片中的所有文字内容。直接输出识别的文字，保持原文的语言（中文、英文或混合），不要添加任何解释、注释或前缀。如果没有检测到文字，请回复"未检测到文字"。' },
    ],
  }];

  // 用户自带 Key → 直接调 DeepSeek
  if (userKey) {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userKey}`,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.1, max_tokens: 4096, stream: false }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('API Key 无效，请检查');
      if (res.status === 402) throw new Error('账户余额不足');
      if (res.status === 429) throw new Error('请求过于频繁，请稍后再试');
      throw new Error(err.error?.message || `请求失败 (${res.status})`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  // 后端代理
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature: 0.1, maxTokens: 4096 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'AI 服务暂不可用，请稍后重试');
  }

  const data = await res.json();
  return data.content;
}
