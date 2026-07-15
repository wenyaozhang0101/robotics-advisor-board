import { useI18n } from '../i18n'

type PolicyId = 'guidelines' | 'privacy' | 'moderation' | 'corrections' | 'methodology' | 'limitations' | 'contact'
const content: Record<PolicyId, { en: { title: string; intro: string; sections: [string, string[]][] }; zh: { title: string; intro: string; sections: [string, string[]][] } }> = {
  guidelines: {
    en: { title: 'Community guidelines', intro: 'Write about firsthand, observable advising experiences with enough context to be useful and fair.', sections: [['Include', ['Your relationship and approximate time period', 'Observable communication, funding, meeting, authorship, workload, or mentoring practices', 'What happened—not guesses about motives or personality']], ['Do not include', ['Threats, harassment, slurs, doxxing, student names, private contacts, or medical claims', 'Unsupported criminal or sexual allegations presented as fact', 'Fabricated quotations, revenge submissions, impersonation, spam, or coordinated manipulation']]] },
    zh: { title: '社区规范', intro: '请基于亲身、可观察的指导经历，并提供足够背景，让内容对他人有帮助且尽可能公平。', sections: [['应当包含', ['你与教师的关系和大致时间', '可观察的沟通、经费、会议、署名、工作量或指导方式', '实际发生了什么，而非揣测动机或人格']], ['禁止内容', ['威胁、骚扰、歧视、开盒、学生姓名、私人联系方式或医疗判断', '把未经支持的刑事或性指控陈述为既定事实', '编造引语、报复投稿、冒充、垃圾信息或组织化刷分']]] },
  },
  privacy: {
    en: { title: 'Privacy policy', intro: 'The platform minimizes data collection but cannot promise legal, forensic, or provider-level anonymity.', sections: [['Public data', ['Approved review text, approximate year, relationship type, scores, and faculty-scoped pseudonym', 'No reviewer UUID, email, IP address, device fingerprint, or moderation note is public']], ['Provider limits', ['GitHub Pages, Supabase, Cloudflare, DNS, and network providers may retain operational logs under their own policies', 'The application does not add analytics, visitor counters, or invasive fingerprinting by default']]] },
    zh: { title: '隐私政策', intro: '平台尽量减少数据收集，但无法承诺法律、取证或基础设施层面的匿名。', sections: [['公开数据', ['审核通过的评论、近似年份、关系类型、评分和教师范围化化名', '评论者 UUID、邮箱、IP、设备指纹和审核备注均不公开']], ['服务商限制', ['GitHub Pages、Supabase、Cloudflare、DNS 和网络服务商可能按各自政策保留运行日志', '应用默认不加入分析工具、访问计数或侵入式指纹']]] },
  },
  moderation: {
    en: { title: 'Content moderation policy', intro: 'Every new or edited review begins as pending and only approved content is public or included in aggregates.', sections: [['Process', ['Moderators may approve, reject, hide, or hear an appeal', 'Reports and actions are recorded in a private append-only audit trail', 'Serious, identifying, or legally sensitive claims receive heightened review']]] },
    zh: { title: '内容审核政策', intro: '新评论和修改后的评论均从待审核开始；只有通过审核的内容才会公开并计入统计。', sections: [['流程', ['审核员可通过、拒绝、隐藏内容或处理申诉', '举报和操作会记录到私有、仅追加的审计日志', '严重、可识别个人或涉及法律风险的内容会接受加强审核']]] },
  },
  corrections: {
    en: { title: 'Corrections and appeals', intro: 'Faculty members and institutions may request corrections, privacy review, or review of suspected impersonation without receiving reviewer identity.', sections: [['Contact', ['Send the public profile URL, the specific factual issue, and supporting institutional source to contact@example-domain.org', 'Reviewers may appeal a rejected or hidden submission using its private reference code']]] },
    zh: { title: '更正与申诉', intro: '教师或学校可申请更正、隐私审查或冒充内容审查，但不会因此获得评论者身份。', sections: [['联系', ['将公开档案链接、具体事实问题和校方依据发送至 contact@example-domain.org', '投稿者可使用私有编号对被拒绝或隐藏的内容提出申诉']]] },
  },
  methodology: {
    en: { title: 'Methodology', intro: 'The recommendation score is the mean of approved 0–10 overall scores. The caution score is 10 minus that mean.', sections: [['Ranking', ['0–2 approved reviews: visible but unranked', '3–4: provisional ranking', '5 or more: regular ranking', 'Only approved reviews count; no score is an official assessment']]] },
    zh: { title: '评分方法', intro: '推荐分是已通过审核的 0–10 综合评分均值；不推荐分等于 10 减去该均值。', sections: [['排名', ['0–2 条：可见但不排名', '3–4 条：暂定排名', '5 条及以上：常规排名', '只有通过审核的评论计入；任何分数都不是官方评价']]] },
  },
  limitations: {
    en: { title: 'Data limitations', intro: 'Anonymous, self-selected reports can be incomplete, biased, mistaken, or unrepresentative.', sections: [['Read carefully', ['Sample size and score distribution matter more than rank alone', 'Experiences can change across years, projects, funding sources, and relationships', 'Use official sources and direct conversations alongside this site']]] },
    zh: { title: '数据局限', intro: '匿名、自愿提交的报告可能不完整、有偏差、包含错误或不具代表性。', sections: [['谨慎阅读', ['样本量和分布通常比单一名次更重要', '不同年份、项目、经费和关系下的经历可能变化', '请同时参考官方资料并进行直接沟通']]] },
  },
  contact: {
    en: { title: 'Contact', intro: 'Use a role-based address for corrections, safety concerns, and operational questions.', sections: [['Email', ['contact@example-domain.org', 'This placeholder must be replaced only after a neutral custom-domain mailbox is configured.']]] },
    zh: { title: '联系我们', intro: '更正、安全问题和运行问题请使用角色邮箱。', sections: [['邮箱', ['contact@example-domain.org', '只有在中性自定义域名邮箱配置完成后，才能替换此占位地址。']]] },
  },
}

export function PolicyPage({ page }: { page: PolicyId }) {
  const { language } = useI18n(); const policy = content[page][language]
  return <article className="policy-page"><span className="eyebrow">ADVISOR SIGNAL POLICY</span><h1>{policy.title}</h1><p className="policy-intro">{policy.intro}</p>{policy.sections.map(([title, items]) => <section key={title}><h2>{title}</h2><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}</article>
}
