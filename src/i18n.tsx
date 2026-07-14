import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Language } from './types'

const messages = {
  en: {
    subtitle: 'A community-sourced guide to robotics PhD advising in North America',
    demo: 'Demo mode · fictional people and data · submissions are not stored',
    recommended: 'Recommended', notRecommended: 'Caution', submit: 'Anonymous review',
    search: 'Search name, university, or research area', university: 'University', country: 'Country',
    minReviews: 'Minimum reviews', relationship: 'Relationship', clear: 'Clear filters', all: 'All',
    faculty: 'Faculty', outreach: 'Outreach', interview: 'Interview', student: 'Student experience',
    communityScore: 'Community-reported score', cautionScore: 'Non-recommendation score', reviews: 'Reviews',
    provisional: 'Provisional', unranked: 'Insufficient data', regular: 'Regular ranking',
    dataWarning: 'Small samples are not statistically reliable. Scores describe community reports, not objective facts.',
    lastUpdated: 'Last updated', viewProfile: 'View details', officialProfile: 'Official profile',
    home: 'Leaderboard', requestFaculty: 'Request faculty', admin: 'Moderation', policies: 'Policies',
    positive: 'Positive aspects', concerns: 'Concerns or warnings', context: 'Additional factual context',
    report: 'Report', submitReview: 'Submit an anonymous review', facultySelect: 'Faculty',
    year: 'Experience year', term: 'Application semester (if applicable)', offer: 'Offer communication',
    overall: 'Overall recommendation', consent: 'I agree to the community guidelines and confirm this is firsthand experience.',
    privacyReminder: 'Do not include student names, private contact details, medical claims, or identifying information.',
    demoSubmit: 'Preview submission', pending: 'In live mode, valid submissions enter moderation as pending.',
    notStored: 'Demo confirmed: this submission was validated locally and was not stored.',
    requestTitle: 'Request a faculty profile', requestHelp: 'Only provide public institutional information. Requests require moderation.',
    proposedName: 'Proposed faculty name', proposedUniversity: 'University', department: 'Department',
    profileUrl: 'Official university profile URL', sendRequest: 'Preview request',
    adminTitle: 'Moderation workspace', adminDemo: 'Read-only demo. Live moderation requires an allowlisted Supabase administrator.',
    guidelines: 'Community guidelines', privacy: 'Privacy policy', moderation: 'Moderation policy',
    corrections: 'Corrections and appeals', methodology: 'Methodology', limitations: 'Data limitations', contact: 'Contact',
    noResults: 'No faculty match these filters.', back: 'Back to leaderboard', language: '中文',
    scoreHint: '0 extremely negative · 5 mixed · 10 extremely positive', reportReview: 'Report review',
    reportReason: 'Reason', reportDetails: 'Details', cancel: 'Cancel', sendReport: 'Preview report',
  },
  zh: {
    subtitle: '北美机器人方向博士生导师的社区经验指南',
    demo: '演示模式 · 人物和数据均为虚构 · 投稿不会被保存',
    recommended: '红榜', notRecommended: '黑榜', submit: '匿名投稿',
    search: '搜索姓名、学校或研究方向', university: '学校', country: '国家',
    minReviews: '最低评论数', relationship: '关系类型', clear: '清除筛选', all: '全部',
    faculty: '教师信息', outreach: '套磁体验', interview: '面试体验', student: '学生就读体验',
    communityScore: '社区报告推荐分', cautionScore: '不推荐分', reviews: '评论数',
    provisional: '暂定排名', unranked: '数据不足', regular: '常规排名',
    dataWarning: '小样本不具统计可靠性。分数仅概括社区报告，并非客观事实或官方评价。',
    lastUpdated: '最近更新', viewProfile: '查看详情', officialProfile: '校方主页',
    home: '排行榜', requestFaculty: '申请新增教师', admin: '审核后台', policies: '政策',
    positive: '积极方面', concerns: '担忧或提醒', context: '补充事实背景',
    report: '举报', submitReview: '提交匿名评论', facultySelect: '选择教师',
    year: '经历年份', term: '申请学期（如适用）', offer: 'Offer 沟通',
    overall: '综合推荐分', consent: '我同意社区规范，并确认内容来自亲身经历。',
    privacyReminder: '请勿填写学生姓名、私人联系方式、医疗判断或其他可识别个人的信息。',
    demoSubmit: '预览投稿', pending: 'Live 模式下，有效投稿会以待审核状态进入后台。',
    notStored: '演示验证完成：此投稿仅在本地校验，没有保存。',
    requestTitle: '申请新增教师档案', requestHelp: '请仅提供公开的学校信息；所有请求均需审核。',
    proposedName: '教师姓名', proposedUniversity: '学校', department: '院系',
    profileUrl: '学校官方主页链接', sendRequest: '预览申请',
    adminTitle: '内容审核工作区', adminDemo: '只读演示。Live 审核仅对 Supabase 管理员白名单开放。',
    guidelines: '社区规范', privacy: '隐私政策', moderation: '审核政策',
    corrections: '更正与申诉', methodology: '评分方法', limitations: '数据局限', contact: '联系我们',
    noResults: '没有符合当前筛选条件的教师。', back: '返回排行榜', language: 'English',
    scoreHint: '0 极度负面 · 5 中立或复杂 · 10 极度正面', reportReview: '举报评论',
    reportReason: '举报原因', reportDetails: '详细说明', cancel: '取消', sendReport: '预览举报',
  },
} as const

export type MessageKey = keyof typeof messages.en
interface I18nValue { language: Language; setLanguage: (value: Language) => void; t: (key: MessageKey) => string }
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const initial: Language = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  const [language, setLanguage] = useState<Language>(initial)
  const value = useMemo(() => ({ language, setLanguage, t: (key: MessageKey) => messages[language][key] }), [language])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Shared hook intentionally lives with its provider to keep the translation boundary cohesive.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}
