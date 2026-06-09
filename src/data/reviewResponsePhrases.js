/**
 * Review response phrase library.
 * Each category provides diverse expressions for constructing
 * professional, polite responses to reviewer comments.
 */

export const zhPhrases = {
  // Opening for entire response letter
  letterOpening: [
    '尊敬的审稿人：\n\n感谢您在百忙之中对本论文提出的宝贵意见和建议。我们已逐条认真研究了每一条意见，并对论文进行了相应修改。以下是逐条回复：',
    '尊敬的审稿专家：\n\n感谢您对本文的细致审阅。您的每一条意见都对提升论文质量起到了重要作用。以下是我们对您意见的逐条回复：',
    '尊敬的审稿人：\n\n非常感激您对本文的深入评审。您的建议让我们对研究有了更全面的认识。以下是我们针对每一条意见的修改说明：',
    '尊敬的审稿人：\n\n衷心感谢您的专业评审。我们认真考虑了您的所有意见，并对论文进行了全面修订。逐条回复如下：',
    '尊敬的审稿人：\n\n诚挚感谢您的辛勤审稿工作。您的意见极具建设性，我们已据此对论文进行了实质性修改。以下是详细回应：',
  ],

  // Thanks for a specific comment
  thanks: [
    '感谢审稿人指出这一点。',
    '非常感谢您的这一建议。',
    '谢谢您提出这一重要问题。',
    '感谢审稿人的细心观察。',
    '非常感谢您敏锐地发现这一问题。',
    '感谢您提出这一建设性意见。',
    '感谢您的指正，这对提升本文质量非常重要。',
    '谢谢您关注到这一细节。',
    '感谢审稿人的专业意见。',
    '非常感谢您的这条评论。',
  ],

  // Agreement with comment
  agree: [
    '我们完全同意您的观点。',
    '您的意见非常正确。',
    '我们认同审稿人的看法。',
    '这一建议很有道理。',
    '您的观点准确，我们深表同意。',
    '我们赞同审稿人的这一意见。',
    '您的分析非常到位。',
    '这一意见确实切中要害。',
  ],

  // What was changed (response)
  changed: [
    '我们已在修改稿中补充了相关内容（详见第X节）。',
    '已根据您的建议对相应部分进行了修改。',
    '我们已按照您的意见在文中进行了修正。',
    '已在修订稿中进行了相应调整。',
    '我们已采纳您的建议，并在新版中进行了修改。',
    '已对论文进行了相应的补充和修改。',
    '我们已重新撰写了该部分内容。',
    '该问题已在修改稿中得到修正。',
  ],

  // Disagreement / clarification (polite)
  clarify: [
    '感谢您的意见。关于这一点，我们想补充说明：{{response}}',
    '我们理解您的关切。然而，需要说明的是：{{response}}',
    '感谢审稿人的建议。我们对此的解释是：{{response}}',
    '关于您提到的这一问题，我们希望能提供更多背景信息：{{response}}',
    '审稿人的意见促使我们进行了深入思考，我们的理解是：{{response}}',
  ],

  // Explain what specific changes were made
  specificChange: [
    '具体而言，我们增加了{{response}}。',
    '具体修改如下：{{response}}。',
    '我们在文中补充了{{response}}。',
    '修改后的内容为：{{response}}。',
    '新增内容包括：{{response}}。',
    '我们进行了以下调整：{{response}}。',
  ],

  // Closing the response letter
  letterClosing: [
    '\n再次感谢审稿人的宝贵时间与专业意见。我们相信这些修改显著提升了本文的质量。期待您的进一步指导。',
    '\n再次衷心感谢您的审阅。如有任何疑问，请随时指出。',
    '\n非常感谢您的辛勤付出和对本文的持续关注。',
    '\n再次感谢审稿人对本文的贡献。我们期待您的最终意见。',
  ],
}

/**
 * Standalone reply starters — used by "随机话术" button.
 * Each is a complete response sentence that users can use as-is or customize.
 */
export const replyStarters = {
  zh: [
    '感谢您的宝贵意见。我们已在修改稿中补充了相关内容。',
    '非常感谢审稿人指出这一点。我们已对相应部分进行了修改。',
    '感谢您的细致审阅。我们采纳了您的建议，并在新版中进行了修改。',
    '谢谢您提出这一重要问题。我们已在文中进行了修正。',
    '感谢审稿人的专业意见。我们已重新撰写了该部分内容。',
    '非常感谢您的这一建议。该问题已在修改稿中得到修正。',
    '感谢审稿人的细心观察。我们已根据您的意见进行了相应调整。',
    '感谢您关注到这一细节。我们已对论文进行了相应的补充。',
    '非常感谢您敏锐地发现这一问题。我们在修改稿中做了说明。',
    '感谢审稿人提出的建设性意见。我们已将该建议体现在修改稿中。',
    '感谢您的指正。我们已仔细核查并更正了相关描述。',
    '谢谢您的评论。我们同意您的观点，已按照建议修改。',
    '感谢审稿人的提醒。我们已在讨论部分补充了相关分析。',
    '非常感谢您的这条评论。我们已经做了相应的补充和修改。',
    '感谢审稿人的质疑。我们在修改稿中对这一点进行了澄清。',
    '谢谢您的建议。我们已在修改稿中强化了这一论点。',
    '感谢审稿人提出的修改方向。我们据此对论文进行了相应修订。',
    '感谢您的深刻见解。我们已在正文中补充了更充分的讨论。',
    '谢谢审稿人的专业评审。我们已对所有相关段落进行了修改。',
    '感谢您的耐心审阅。我们已逐条响应并做了相应修订。',
  ],
  en: [
    'We thank the reviewer for this valuable suggestion. We have revised the manuscript accordingly.',
    'Thank you for this insightful comment. We have incorporated the suggested changes.',
    'We appreciate the reviewer pointing this out. The manuscript has been updated.',
    'Thank you for your careful observation. We have corrected this in the revised version.',
    'We are grateful for this constructive feedback. The relevant section has been rewritten.',
    'Thank you for raising this important point. We have addressed it in the revision.',
    'We appreciate this suggestion. We have added the recommended content.',
    'Thank you for this comment. We have clarified this point in the manuscript.',
    'We agree with the reviewer and have made the corresponding changes.',
    'Thank you for catching this. We have corrected the error.',
    'We appreciate the reviewer\'s thoroughness. The issue has been resolved.',
    'Thank you for your expert opinion. We have strengthened this argument.',
    'We are grateful for this detailed review. All suggested revisions have been made.',
    'Thank you for this observation. We now provide additional explanation.',
    'We appreciate your thoughtful review. The paper has been improved accordingly.',
    'Thank you for the suggestion. We have expanded the discussion on this point.',
    'We thank the reviewer for identifying this gap. We have filled it in the revision.',
    'Thank you for your time. We have carefully addressed all your concerns.',
    'We appreciate this critical feedback. It has significantly improved our manuscript.',
    'Thank you for the recommendation. We have restructured this section as suggested.',
  ],
}

export const enPhrases = {
  letterOpening: [
    'Dear Reviewer,\n\nWe sincerely appreciate your thorough review and constructive feedback on our manuscript. We have carefully addressed each comment and revised the manuscript accordingly. Our point-by-point response follows:',
    'Dear Reviewer,\n\nThank you for your insightful comments and suggestions. Your careful reading has substantially improved the quality of this paper. Below, we address each point in detail:',
    'Dear Reviewer,\n\nWe are grateful for your detailed review and valuable suggestions. We have carefully considered all your comments and made corresponding revisions. Here is our response:',
    'Dear Reviewer,\n\nYour expert review has been extremely helpful. We appreciate the time and effort you invested. We have thoroughly revised the manuscript based on your feedback, as detailed below:',
  ],

  thanks: [
    'We thank the reviewer for this important point.',
    'We appreciate the reviewer raising this issue.',
    'Thank you for this observation.',
    'We are grateful for the reviewer pointing this out.',
    'Thank you for this valuable suggestion.',
    'We appreciate this insightful comment.',
    'Thank you for catching this.',
    'We appreciate the reviewer\'s careful attention to this detail.',
  ],

  agree: [
    'We fully agree with the reviewer.',
    'This is an excellent point.',
    'We concur with this assessment.',
    'The reviewer is absolutely right.',
    'We agree with this suggestion entirely.',
    'This is a very valid concern.',
  ],

  changed: [
    'We have revised the manuscript accordingly (see Section X).',
    'We have incorporated this suggestion in the revised manuscript.',
    'The manuscript has been updated to address this point.',
    'We have made the recommended changes.',
    'This has been corrected in the revised version.',
    'We have added the suggested content.',
    'The relevant section has been rewritten.',
    'This issue has been addressed in the revision.',
  ],

  clarify: [
    'We appreciate the reviewer\'s concern. To clarify: {{response}}',
    'We understand the reviewer\'s point. We would like to note that: {{response}}',
    'Thank you for this comment. We respectfully provide the following explanation: {{response}}',
    'We appreciate the opportunity to elaborate: {{response}}',
  ],

  specificChange: [
    'Specifically, we added: {{response}}',
    'In the revised manuscript, we now: {{response}}',
    'We have included the following: {{response}}',
    'The revised text reads: {{response}}',
    'Our revision includes: {{response}}',
  ],

  letterClosing: [
    '\nOnce again, we sincerely thank the reviewer for the valuable feedback. We believe these revisions have substantially improved the manuscript.',
    '\nWe greatly appreciate the reviewer\'s time and expertise. We remain open to any further questions.',
    '\nThank you again for your careful review and constructive suggestions.',
  ],
}

export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateLetterOpening(lang) {
  const p = lang === 'zh' ? zhPhrases : enPhrases
  return randomPick(p.letterOpening)
}

export function generateLetterClosing(lang) {
  const p = lang === 'zh' ? zhPhrases : enPhrases
  return randomPick(p.letterClosing)
}

/**
 * Generate a single response block.
 * @param {string} lang
 * @param {string} comment - reviewer comment
 * @param {string} response - user's response text
 */
export function generateResponseBlock(lang, comment, response) {
  const p = lang === 'zh' ? zhPhrases : enPhrases
  const thanks = randomPick(p.thanks)

  // Decide response type based on pattern
  const isDisagreement = response.includes('但') || response.includes('然而') || response.includes('不过') ||
    response.toLowerCase().includes('however') || response.toLowerCase().includes('but ')

  let body
  if (isDisagreement) {
    const clarify = randomPick(p.clarify).replace(/\{\{response\}\}/g, response)
    body = thanks + ' ' + clarify
  } else {
    const agree = randomPick(p.agree)
    const changed = randomPick(p.changed)
    const specific = Math.random() > 0.5 ? ' ' + randomPick(p.specificChange).replace(/\{\{response\}\}/g, response) : ' ' + response
    body = thanks + ' ' + agree + ' ' + changed + specific
  }

  return {
    comment: comment,
    response: body,
  }
}

/**
 * Generate full formatted response letter.
 * @param {string} lang
 * @param {Array<{comment: string, response: string}>} items
 */
export function generateFullResponse(lang, items) {
  const valid = items.filter(it => it.comment.trim() || it.response.trim())
  if (valid.length === 0) return ''

  const p = lang === 'zh' ? zhPhrases : enPhrases
  let text = randomPick(p.letterOpening)
  text += '\n\n'

  valid.forEach((item, i) => {
    const block = generateResponseBlock(lang, item.comment, item.response)
    const prefix = lang === 'zh' ? `【意见 ${i + 1}】` : `[Comment ${i + 1}]`
    const respPrefix = lang === 'zh' ? '【回复】' : '[Response]'
    text += `${prefix}\n${block.comment}\n\n${respPrefix}\n${block.response}\n\n`
    text += '—' .repeat(40) + '\n\n'
  })

  text += randomPick(p.letterClosing)
  return text.trim()
}
