/**
 * Cover letter phrase library — combinatorial explosion yields 200+ variants.
 * Each category has multiple expressions; the generator picks one at random from each.
 *
 * Theory: 10 salutation × 20 opening × 15 significance × 20 contribution
 *        × 8 statement × 10 closing × 3 optional sections
 *        ≈ 10 * 20 * 15 * 20 * 8 * 10 = 4,800,000 combinations (minus some trivials).
 *
 * Placeholders: {{title}} {{journal}} {{author}} {{affiliation}} {{contribution}}
 *               {{declaration}} {{date}}
 */

export const zhPhrases = {
  salutation: [
    '尊敬的《{{journal}}》编辑部：',
    '尊敬的编辑部老师：',
    '尊敬的编委会：',
    '尊敬的审稿专家：',
    '尊敬的《{{journal}}》主编及各位编辑：',
    '尊敬的编审老师：',
    '尊敬的《{{journal}}》编辑团队：',
    '尊敬的主编先生/女士：',
    '尊敬的编辑部同仁：',
    '尊敬的杂志社编辑：',
  ],

  opening: [
    '我们谨向贵刊提交题为《{{title}}》的研究论文，恳请审阅。',
    '在此提交论文《{{title}}》，望贵刊予以考虑发表。',
    '我们荣幸地向《{{journal}}》投稿论文，题目为《{{title}}》。',
    '现向贵刊投稿论文一篇，标题为《{{title}}》，敬请审阅。',
    '本人代表全体作者向《{{journal}}》投稿研究论文《{{title}}》。',
    '我们诚挚地向贵刊提交稿件，论文题目为《{{title}}》。',
    '随函向贵刊呈交论文《{{title}}》，希望获得发表机会。',
    '本文旨在向《{{journal}}》投稿论文《{{title}}》，恳请审阅指导。',
    '我们非常高兴地向《{{journal}}》提交研究论文《{{title}}》。',
    '兹向贵刊投稿论文《{{title}}》，恳请编委会予以评审。',
    '我们以此函向贵刊提交题为《{{title}}》的原创研究论文。',
    '本人偕同全体作者，向《{{journal}}》投稿论文《{{title}}》。',
    '我们提交稿件《{{title}}》，拟在贵刊发表，敬请审阅。',
    '现提交论文《{{title}}》供贵刊审阅，期待您的评价。',
    '我们诚挚希望论文《{{title}}》能在《{{journal}}》上发表。',
    '此处提交原创研究论文《{{title}}》，敬请贵刊考虑刊载。',
    '我们在此提交论文《{{title}}》，以申请在《{{journal}}》发表。',
    '随信附上论文手稿《{{title}}》，请编辑部予以审阅。',
    '现呈上论文《{{title}}》，恳请审阅并考虑发表。',
    '我们提交这篇题为《{{title}}》的论文，期待贵刊的积极回复。',
  ],

  significance: [
    '本研究聚焦{{contribution}}，具有一定的理论价值和实践意义。',
    '本文探讨了{{contribution}}，可为该领域的研究提供新的视角。',
    '本研究的创新之处在于{{contribution}}，有望推动相关领域的发展。',
    '该研究从{{contribution}}角度切入，填补了现有研究的空白。',
    '本文在{{contribution}}方面做出了有益探索，具有重要的参考价值。',
    '本研究系统性地阐述了{{contribution}}，对学界和业界均有启发。',
    '该论文的核心贡献在于{{contribution}}，为后续研究奠定了基础。',
    '本文从理论与实证两个层面对{{contribution}}进行了深入分析。',
    '本研究的结果对{{contribution}}领域具有重要的指导意义。',
    '该论文首次系统地研究了{{contribution}}，具有开创性。',
    '本文的研究发现为{{contribution}}提供了全新的解释框架。',
    '本研究的意义在于{{contribution}}，有望引发广泛讨论。',
    '该论文的突出贡献是{{contribution}}，具有较好的应用前景。',
    '本文围绕{{contribution}}展开深入研究，取得了有价值的成果。',
    '该研究的学术价值体现在{{contribution}}方面，值得报道。',
  ],

  contribution: [
    '本文首次提出了{{contribution}}，并在实验中得到验证。',
    '我们的研究揭示了{{contribution}}，拓展了该领域的认识。',
    '本文创新性地发现{{contribution}}，为该问题提供了新的解决方案。',
    '本研究的主要贡献在于{{contribution}}，其性能优于已有方法。',
    '我们通过大量实验验证了{{contribution}}的有效性。',
    '本文在{{contribution}}方面取得了突破性进展。',
    '该研究的突出之处在于{{contribution}}，显著优于现有方法。',
    '我们证明了{{contribution}}，这对实际应用具有重要意义。',
    '本文提出的{{contribution}}方法，在多个数据集上取得了最优结果。',
    '本研究的创新点在于{{contribution}}，填补了该领域的空白。',
    '我们首次将{{contribution}}应用于该问题，取得了显著效果。',
    '本文从新颖的角度分析了{{contribution}}，得出了有启发的结论。',
    '研究结果表明{{contribution}}，为后续工作指明了方向。',
    '我们设计了一种新的{{contribution}}方法，具有更好的鲁棒性。',
    '本研究开创性地探索了{{contribution}}，取得了令人鼓舞的结果。',
    '本文系统地研究了{{contribution}}，建立了完整的理论框架。',
    '我们提出了{{contribution}}，并对其进行了全面的实验评估。',
    '本文在{{contribution}}方面做出了原创性贡献。',
    '该研究通过{{contribution}}，解决了长期存在的挑战性问题。',
    '我们开发的新方法在{{contribution}}方面表现优异。',
  ],

  statement: [
    '本文未在其他期刊投稿或发表，所有作者均同意向贵刊投稿。',
    '本文为原创研究，未在其他出版物上发表，全体作者一致同意投稿。',
    '我们声明：本文尚未在其他任何期刊投稿或发表，且所有作者均已阅读并同意投稿。',
    '本文系原创作品，未一稿多投，所有作者对投稿无异议。',
    '我们承诺本文未同时投稿至其他期刊，且无利益冲突。',
    '本文不存在版权纠纷，所有数据真实可靠，作者均同意投稿。',
    '本文从未在其他平台发表或投稿，作者一致同意在贵刊发表。',
    '我们确认本文为原创且未发表，全体作者均同意向《{{journal}}》投稿。',
  ],

  closing: [
    '感谢您拨冗审阅，期待您的宝贵意见。',
    '衷心感谢您的审阅，期待收到您的反馈。',
    '感谢编辑部和审稿专家为本文付出的精力，期待您的回复。',
    '非常感谢您抽出时间审阅本文，期待您的指导。',
    '感谢您的审阅，如有任何疑问，请随时联系。',
    '由衷感谢您的宝贵时间，期待您对本文的评价。',
    '我们对您审阅本文的付出深表感谢，期待得到积极的反馈。',
    '感谢您审阅本文，期待能与您就此工作进行深入交流。',
    '再次感谢编辑部和审稿人的辛勤工作，期待您的意见。',
    '感谢您对本文的关注，期待您的审阅意见。',
  ],

  signoff: [
    '\n此致\n敬礼\n\n{{author}}\n{{date}}',
    '\n此致\n\n{{author}}\n{{date}}',
    '\n顺祝\n编安\n\n{{author}}\n{{date}}',
    '\n祝好\n\n{{author}}\n{{date}}',
    '\n谨此\n致谢\n\n{{author}}\n{{date}}',
    '\n\n通讯作者：{{author}}\n{{affiliationLine}}\n{{date}}',
    '\n——{{author}}\n{{date}}',
    '\n谢谢！\n\n{{author}}\n{{date}}',
  ],
}

export const enPhrases = {
  salutation: [
    'Dear Editor of {{journal}},',
    'Dear Editor-in-Chief,',
    'Dear Editorial Board of {{journal}},',
    'Dear Editors,',
    'Dear Editor and Reviewers,',
    'To the Editor of {{journal}}:',
    'Dear Esteemed Editor,',
    'Dear Professor,',
    'Dear Editorial Team,',
    'Dear Sir/Madam,',
  ],

  opening: [
    'We are pleased to submit our manuscript entitled "{{title}}" for consideration for publication in {{journal}}.',
    'Please find enclosed our manuscript "{{title}}" which we wish to submit to {{journal}} for review.',
    'We hereby submit the manuscript "{{title}}" for publication in {{journal}}.',
    'On behalf of all co-authors, I am submitting our paper "{{title}}" to {{journal}}.',
    'We would like to submit our research paper "{{title}}" for possible publication in {{journal}}.',
    'We are delighted to submit our manuscript titled "{{title}}" for consideration in {{journal}}.',
    'I am writing to submit our manuscript "{{title}}" to {{journal}} for review.',
    'Please consider our manuscript "{{title}}" for publication in your esteemed journal {{journal}}.',
    'We respectfully submit the manuscript "{{title}}" for consideration in {{journal}}.',
    'Attached please find our original research article "{{title}}" for submission to {{journal}}.',
    'We wish to submit an original research article entitled "{{title}}" to {{journal}}.',
    'It is our pleasure to submit the manuscript "{{title}}" for review by {{journal}}.',
    'We are submitting "{{title}}" for consideration for publication in {{journal}}.',
    'This letter serves to submit our manuscript "{{title}}" to {{journal}}.',
    'We present our work "{{title}}" for consideration in {{journal}}.',
    'We are pleased to present our manuscript "{{title}}" for potential publication in {{journal}}.',
    'Please accept our submission of "{{title}}" for peer review at {{journal}}.',
    'We submit the attached manuscript "{{title}}" for your consideration.',
    'Enclosed is our manuscript "{{title}}" which we hope will be suitable for {{journal}}.',
    'We are honored to submit our research "{{title}}" to the prestigious {{journal}}.',
  ],

  significance: [
    'This study addresses {{contribution}}, offering significant theoretical and practical implications.',
    'Our work provides new insights into {{contribution}}, a topic of considerable importance.',
    'The novelty of this research lies in {{contribution}}, advancing the current state of knowledge.',
    'This paper fills an important gap in the literature by investigating {{contribution}}.',
    'The findings of this study contribute substantially to our understanding of {{contribution}}.',
    'This research makes a meaningful contribution to {{contribution}} from both theoretical and empirical perspectives.',
    'The significance of this work stems from its exploration of {{contribution}}, which has been underexplored.',
    'Our results offer new perspectives on {{contribution}} that are of broad interest.',
    'This paper presents a novel approach to {{contribution}}, which has important real-world applications.',
    'The contribution of this work is both timely and relevant, given the growing interest in {{contribution}}.',
    'We believe this study will generate considerable interest due to its focus on {{contribution}}.',
    'This research provides a systematic investigation of {{contribution}}, yielding valuable insights.',
    'Our findings have important implications for {{contribution}}, opening new avenues for further exploration.',
    'The work presented here advances the understanding of {{contribution}} in significant ways.',
    'This study is among the first to comprehensively examine {{contribution}}.',
  ],

  contribution: [
    'The key contribution of this work is {{contribution}}, which we have validated through rigorous experiments.',
    'We propose a new method for {{contribution}} that outperforms existing approaches.',
    'This paper presents {{contribution}}, an innovative solution to a long-standing challenge.',
    'Our primary contribution is {{contribution}}, demonstrated extensively on benchmark datasets.',
    'We introduce {{contribution}}, a novel framework that achieves state-of-the-art performance.',
    'This work makes the novel contribution of {{contribution}}, backed by comprehensive evaluation.',
    'We develop {{contribution}}, which significantly advances the capabilities in this area.',
    'The novelty of this research is {{contribution}}, which we substantiate with thorough analysis.',
    'This paper advances the state of the art by introducing {{contribution}}.',
    'Our main finding is {{contribution}}, which offers a fresh perspective on the problem.',
    'We demonstrate that {{contribution}} leads to substantial improvements over current methods.',
    'The originality of this work lies in {{contribution}}, which has not been explored previously.',
    'Through extensive experiments, we show that {{contribution}} achieves superior results.',
    'This research makes a pioneering contribution by {{contribution}}.',
    'We establish {{contribution}} as an effective approach through multiple lines of evidence.',
    'The paper introduces {{contribution}} and provides both theoretical and empirical support.',
    'We reveal {{contribution}}, which fundamentally changes our understanding of this phenomenon.',
    'Our proposed approach of {{contribution}} demonstrates marked advantages.',
    'This study contributes {{contribution}}, with implications extending beyond the current domain.',
    'We provide compelling evidence for {{contribution}} through rigorous experimentation.',
  ],

  statement: [
    'This manuscript has not been published or submitted elsewhere. All authors have approved the submission.',
    'We confirm that this work is original, has not been published previously, and is not under consideration elsewhere. All authors agree with the submission.',
    'This paper is original and has not been submitted to any other journal. All co-authors have read and approved the manuscript.',
    'The authors declare that this manuscript is original, has not been published before, and is not currently being considered for publication elsewhere.',
    'We certify that this work is original and there is no conflict of interest. All authors consent to this submission.',
    'This manuscript is not under consideration by any other journal. All authors have contributed to and approved the final version.',
    'The authors confirm that this work is original, unpublished, and all authors consent to submission to {{journal}}.',
    'All authors declare no competing interests and agree to the submission of this manuscript.',
  ],

  closing: [
    'We appreciate your time and consideration. We look forward to hearing from you.',
    'Thank you for considering our manuscript. We await your response with great interest.',
    'We are grateful for your time and consideration. Please do not hesitate to contact us.',
    'We sincerely appreciate your review. We look forward to your feedback.',
    'Thank you for your time and effort in reviewing this work. We are eager to receive your comments.',
    'We appreciate the opportunity to submit to {{journal}}. Thank you for your consideration.',
    'Thank you very much for your attention. We look forward to a positive response.',
    'Your consideration is greatly appreciated. We look forward to hearing from you at your earliest convenience.',
    'We thank you and the reviewers in advance for your valuable time.',
    'We are grateful for the chance to submit to {{journal}} and await your decision.',
  ],

  signoff: [
    '\nSincerely,\n\n{{author}}\n{{date}}',
    '\nYours sincerely,\n\n{{author}}\n{{date}}',
    '\nBest regards,\n\n{{author}}\n{{date}}',
    '\nWith kind regards,\n\n{{author}}\n{{date}}',
    '\nYours faithfully,\n\n{{author}}\n{{date}}',
    '\nRespectfully,\n\n{{author}}\n{{date}}',
    '\n\nCorresponding Author: {{author}}\n{{affiliationLine}}\n{{date}}',
    '\nWarm regards,\n\n{{author}}\n{{date}}',
  ],
}

/**
 * Pick a random item from an array.
 */
export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Build a cover letter using random phrase selection.
 *
 * @param {'zh' | 'en'} lang
 * @param {object} params — { title, journal, author, affiliation, contribution, declaration }
 * @returns {string}
 */
export function generateCoverLetter(lang, params) {
  const { title, journal, author, affiliation, contribution, declaration } = params
  const p = lang === 'zh' ? zhPhrases : enPhrases
  const date = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')
  const affiliationLine = affiliation || ''

  const repl = (str) => str
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{journal\}\}/g, journal)
    .replace(/\{\{author\}\}/g, author)
    .replace(/\{\{affiliation\}\}/g, affiliation || '')
    .replace(/\{\{contribution\}\}/g, contribution || (lang === 'zh' ? '本文的研究问题' : 'the topic of this research'))
    .replace(/\{\{declaration\}\}/g, declaration)
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{affiliationLine\}\}/g, affiliationLine)

  const salutation = repl(randomPick(p.salutation))
  const opening = repl(randomPick(p.opening))
  const significance = repl(randomPick(p.significance))
  const contrib = repl(randomPick(p.contribution))
  const statement = repl(randomPick(p.statement))
  const closing = repl(randomPick(p.closing))
  const signoff = repl(randomPick(p.signoff))

  // Optionally include significance as a separate paragraph (50% chance)
  const sigPara = contribution ? significance : ''
  const includeSig = Math.random() > 0.4 && sigPara

  // Randomly decide if we add a "background" lead-in (30% chance)
  const bgLead = lang === 'zh'
    ? (Math.random() > 0.7
      ? `近年来，${contribution ? contribution : '该研究领域'}受到了广泛关注。` + '\n'
      : '')
    : (Math.random() > 0.7
      ? `Recent years have witnessed growing interest in ${contribution || 'this research area'}.\n`
      : '')

  const contributionSeparator = lang === 'zh' ? '\n' : '\n'
  const paraSep = lang === 'zh' ? '\n' : '\n'

  if (lang === 'zh') {
    return [
      salutation,
      '',
      bgLead + opening,
      includeSig ? '' : '',
      includeSig ? sigPara : '',
      contrib ? contrib : '',
      '',
      statement,
      '',
      closing,
      signoff,
    ].filter(s => s !== '').join('\n').replace(/\n{3,}/g, '\n\n')
  } else {
    return [
      salutation,
      '',
      bgLead + opening,
      includeSig ? '' : '',
      includeSig ? sigPara : '',
      contrib ? contrib : '',
      '',
      statement,
      '',
      closing,
      signoff,
    ].filter(s => s !== '').join('\n').replace(/\n{3,}/g, '\n\n')
  }
}

// ─── FULL TEMPLATES (20+ unique structures for Mode B) ───
// Each template is a COMPLETE cover letter with drastically different
// paragraph flow, sentence connectors, and writing style.

const zhFullTemplates = [
  // 1 — 开门见山型
  `尊敬的《{{journal}}》编辑部：

现提交论文《{{title}}》，申请在贵刊发表。

{{contribution}}

本文为原创研究，未在其它刊物发表。所有作者均同意本投稿。

感谢审阅，期待您的回复。

{{author}}
{{date}}`,

  // 2 — 分段详述型
  `尊敬的编辑老师：

我们团队近期在{{contribution}}方面取得了一些进展，现将成果整理为论文《{{title}}》，向贵刊投稿。

本文的主要工作包括：（1）系统梳理了该领域的研究现状；（2）提出了一种新的分析框架；（3）通过实验验证了方法的有效性。

{{declaration}}

感谢您在百忙之中审阅本文，期待您的宝贵意见。

{{author}}
{{affiliation}}
{{date}}`,

  // 3 — 简洁学术型
  `《{{journal}}》编辑部：

兹投递论文一篇，题目为《{{title}}》，敬请审阅。

本研究的创新之处在于{{contribution}}。

本文未一稿多投，全体作者已确认最终版本。

祝好！

{{author}}
{{date}}`,

  // 4 — 背景展开型
  `尊敬的编委会：

近年来，{{contribution}}引起了学术界的广泛关注。在此背景下，我们开展了系统性研究，撰写了论文《{{title}}》。

本文从理论分析和实验验证两个维度，对该问题进行了深入探讨。我们的结果对相关领域的研究具有参考价值。

我们声明本文无利益冲突，且所有数据真实可靠。

感谢您对本文的关注，期待您的意见。

{{author}}
{{affiliation}}
{{date}}`,

  // 5 — 贡献前置型
  `尊敬的编辑部老师：

我们荣幸地向贵刊推荐论文《{{title}}》。本文的核心贡献在于{{contribution}}，该发现为这一领域提供了新的视角。

研究方法采用……实验结果表明……（详见正文）

本文从未在其他期刊发表，作者一致同意投稿。

感谢您的审阅。

{{author}}
{{date}}`,

  // 6 — 研究意义型
  `尊敬的审稿专家：

我们提交论文《{{title}}》供贵刊审阅。该研究致力于解决{{contribution}}这一关键问题。

我们认为本文的意义主要体现在以下方面：
1. 填补了现有研究的空白；
2. 提出了可复现的方法；
3. 为后续研究提供了新的思路。

{{declaration}}

恭候您的审阅意见。

{{author}}
{{affiliation}}
{{date}}`,

  // 7 — 致信主编型
  `尊敬的主编先生/女士：

我代表全体作者，向《{{journal}}》提交论文《{{title}}》。

本文围绕{{contribution}}展开，取得了一些有价值的结果。我们相信该工作符合贵刊的收稿范围与学术水准。

声明：本文系原创成果，不存在版权争议，作者均无利益冲突。

期待您的回复。

此致
敬礼

{{author}}
{{date}}`,

  // 8 — 方法创新型
  `尊敬的编委老师：

现向贵刊投稿论文《{{title}}》。本文提出了一种新的{{contribution}}方法，在多个实验设置下均优于现有方案。

与传统方法相比，我们的方法在效率、准确性和可扩展性方面均有显著提升。详细对比见正文实验部分。

{{declaration}}

感谢编辑部和审稿人的辛勤工作。

{{author}}
{{affiliation}}
{{date}}`,

  // 9 — 应用驱动型
  `《{{journal}}》编辑团队：

我们开发了一个面向{{contribution}}的解决方案，相关研究成果整理为论文《{{title}}》，现申请在贵刊发表。

该方案已在真实场景中得到验证，具有良好的应用前景。我们相信它能引起贵刊读者的兴趣。

本文尚未发表或投稿至其他期刊，请放心审阅。

谢谢！

{{author}}
{{date}}`,

  // 10 — 礼貌详述型
  `尊敬的编辑部同仁：

您好！我们在此提交论文《{{title}}》，盼望能在《{{journal}}》上发表。

研究背景：{{contribution}}
研究方法：采用了……（详见正文）
主要发现：……（详见正文）

本文为原创作品，未曾在其他平台发表。作者一致同意投稿，并承诺遵守贵刊的学术伦理规范。

感谢您为本稿付出的宝贵时间。如有任何问题，请随时与我们联系。

{{author}}
{{affiliation}}
{{date}}`,

  // 11 — 信函体
  `尊敬的编辑：

随信附上我们的论文手稿《{{title}}》，恳请审阅。

本文的重点是{{contribution}}。经过反复实验和修改，我们认为该工作已达到投稿标准。

我们保证本文不存在一稿多投的情况。

期待您的审稿结果。

谨此致意

{{author}}
{{date}}`,

  // 12 — 三段式
  `尊敬的《{{journal}}》编委会：

第一，我们完成了关于{{contribution}}的研究工作，成果为论文《{{title}}}。

第二，我们在理论、方法和实验三个方面对该问题进行了全面分析，结果具有说服力。

第三，本文严格遵守学术规范，所有作者均已确认最终版本。

感谢审阅，期待回复。

{{author}}
{{affiliation}}
{{date}}`,
]

const enFullTemplates = [
  // 1 — Direct and professional
  `Dear Editor of {{journal}},

I am pleased to submit our manuscript entitled "{{title}}" for consideration for publication in {{journal}}.

The main contribution of this work is {{contribution}}. We believe these findings will be of great interest to your readership.

This manuscript has not been published or submitted elsewhere. All authors have approved the submission.

Thank you for your time and consideration.

Sincerely,
{{author}}
{{date}}`,

  // 2 — Detailed academic
  `Dear Editor-in-Chief,

On behalf of my co-authors, I am submitting our research paper "{{title}}" to {{journal}} for review.

This study addresses {{contribution}}, a topic of growing importance in our field. Through rigorous experimentation and analysis, we demonstrate significant advances over existing approaches.

We confirm that this work is original, has not been published previously, and is not under consideration elsewhere. All authors have read and approved the manuscript.

We sincerely appreciate your review and look forward to your feedback.

Best regards,
{{author}}
{{affiliation}}
{{date}}`,

  // 3 — Concise and impactful
  `Dear Editors,

Please find enclosed our manuscript "{{title}}" submitted for publication in {{journal}}.

Our research makes the novel contribution of {{contribution}}, which we have validated extensively.

This paper is original and has not been submitted to any other journal.

We appreciate your consideration.

Yours faithfully,
{{author}}
{{date}}`,

  // 4 — Research context
  `Dear Editor and Reviewers of {{journal}},

Recent advances in this field have highlighted the importance of {{contribution}}. In this context, we present our work "{{title}}", which offers new insights and practical solutions.

Our findings demonstrate clear improvements over current methods, with implications for both theory and practice.

All authors declare no competing interests and agree to the submission of this manuscript.

We are grateful for your time and await your response with great interest.

With kind regards,
{{author}}
{{affiliation}}
{{date}}`,

  // 5 — Method-focused
  `Dear Editorial Board,

We wish to submit our manuscript titled "{{title}}" for consideration in {{journal}}.

We propose a novel approach: {{contribution}}. Through comprehensive evaluation, we show that our method consistently outperforms state-of-the-art baselines across multiple metrics.

This work has not been published or submitted elsewhere. All authors consent to this submission.

Thank you for your attention. We look forward to hearing from you.

Sincerely,
{{author}}
{{date}}`,

  // 6 — Significance-led
  `To the Editor of {{journal}}:

We are delighted to submit our paper "{{title}}" for possible publication in your esteemed journal.

The significance of this research lies in {{contribution}}. We believe this work fills an important gap in the literature and offers a foundation for future investigations.

We certify that this manuscript is original and all authors have contributed to and approved the final version.

Thank you for considering our manuscript. We eagerly await your decision.

Respectfully,
{{author}}
{{affiliation}}
{{date}}`,

  // 7 — Three-point contribution
  `Dear Professor,

I am writing to submit our manuscript "{{title}}" to {{journal}} for review.

Our work makes three primary contributions:
1. {{contribution}}
2. A comprehensive experimental validation
3. Open-source release of code and data to facilitate reproducibility

This manuscript is not under consideration at any other journal. All authors confirm their agreement with the submission.

We greatly appreciate your time and consideration.

Warm regards,
{{author}}
{{date}}`,

  // 8 — Application-oriented
  `Dear Editorial Team of {{journal}},

Attached please find our original research article "{{title}}" for submission to {{journal}}.

We have developed a practical solution for {{contribution}}, which we demonstrate in real-world settings. The results indicate substantial practical benefits.

The authors declare no conflict of interest. This manuscript has not been submitted elsewhere.

We are grateful for the opportunity to submit to {{journal}} and await your decision.

Sincerely,
{{author}}
{{affiliation}}
{{date}}`,

  // 9 — Formal and thorough
  `Dear Esteemed Editor,

Please accept our submission of "{{title}}" for peer review at {{journal}}.

Building upon recent developments, this paper introduces {{contribution}}. We provide both theoretical justification and empirical evidence, showing consistent improvements across diverse experimental settings.

This work is original and all authors consent to publication in {{journal}}. We have followed all ethical guidelines.

Your consideration is greatly appreciated. We remain at your disposal for any questions.

Yours sincerely,
{{author}}
{{date}}`,

  // 10 — Brief and polite
  `Dear Sir/Madam,

We hereby submit the manuscript "{{title}}" for publication in {{journal}}.

The key finding of this study is {{contribution}}.

This manuscript is original work, not under review elsewhere, and all authors have approved the final version.

Thank you very much for your time and consideration.

Sincerely,
{{author}}
{{date}}`,
]

/**
 * Generate cover letter from a FULL template (Mode B).
 * Randomly picks one of 22 complete templates with different structures.
 */
export function generateFromFullTemplate(lang, params) {
  const { title, journal, author, affiliation, contribution, declaration } = params
  const templates = lang === 'zh' ? zhFullTemplates : enFullTemplates
  const date = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')
  const template = randomPick(templates)

  return template
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{journal\}\}/g, journal)
    .replace(/\{\{author\}\}/g, author)
    .replace(/\{\{affiliation\}\}/g, affiliation || '')
    .replace(/\{\{contribution\}\}/g, contribution || (lang === 'zh' ? '本文的研究问题' : 'the topic of this research'))
    .replace(/\{\{declaration\}\}/g, declaration || (lang === 'zh' ? '本文未在其他期刊投稿或发表，所有作者均同意投稿。' : 'This manuscript has not been published or submitted elsewhere.'))
    .replace(/\{\{date\}\}/g, date)
}

/**
 * Hybrid generator: 50% phrase-combo (Mode A), 50% full-template (Mode B).
 * Ensures 200+ effective variants through combinatorial explosion.
 */
export function generateCoverLetterHybrid(lang, params) {
  if (Math.random() < 0.5) {
    return generateCoverLetter(lang, params)
  } else {
    return generateFromFullTemplate(lang, params)
  }
}
