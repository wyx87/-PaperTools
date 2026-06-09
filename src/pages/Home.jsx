import { Link } from 'react-router-dom'
import {
  FileText, PenTool, BookMarked, BarChart3, Send,
  Shield, Lock, ChevronRight,
} from 'lucide-react'

const categories = [
  {
    id: 'pdf',
    to: '/category/pdf',
    icon: FileText,
    iconBg: '#EFF6FF',
    iconBorder: '#DBEAFE',
    iconColor: '#3B82F6',
    badgeBg: '#EFF6FF',
    badgeColor: '#3B82F6',
    title: 'PDF 全能处理',
    desc: '合并、拆分、压缩、转Word、转图片、旋转删页——6大功能·纯浏览器本地处理',
    count: 6,
  },
  {
    id: 'writing',
    to: '/category/writing',
    icon: PenTool,
    iconBg: '#F9FAFB',
    iconBorder: '#E5E7EB',
    iconColor: '#6B7280',
    badgeBg: '#F3F4F6',
    badgeColor: '#6B7280',
    title: '论文写作辅助',
    desc: '字数统计、标点统一、学术句式模板、排版清理——提升写作效率',
    count: 4,
  },
  {
    id: 'reference',
    to: '/category/reference',
    icon: BookMarked,
    iconBg: '#F0FDFA',
    iconBorder: '#CCFBF1',
    iconColor: '#14B8A6',
    badgeBg: '#F0FDFA',
    badgeColor: '#14B8A6',
    title: '文献与引用',
    desc: '参考文献生成、作者拼音排序——高效管理学术引用',
    count: 2,
  },
  {
    id: 'chart',
    to: '/category/chart',
    icon: BarChart3,
    iconBg: '#FAF5FF',
    iconBorder: '#F3E8FF',
    iconColor: '#8B5CF6',
    badgeBg: '#FAF5FF',
    badgeColor: '#8B5CF6',
    title: '图表·表格·公式',
    desc: '柱状/折线/饼/散点/雷达/面积/组合图、三线表、流程图、思维导图——共10个工具',
    count: 11,
  },
  {
    id: 'submit',
    to: '/category/submit',
    icon: Send,
    iconBg: '#F0FDF4',
    iconBorder: '#DCFCE7',
    iconColor: '#22C55E',
    badgeBg: '#F0FDF4',
    badgeColor: '#22C55E',
    title: '投稿检查',
    desc: '投稿信生成、审稿回复、投稿前清单自检——投稿一站式准备',
    count: 3,
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div style={{ marginTop: 36, marginBottom: 44, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(2.8rem, 4.7vw, 3.25rem)',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#1E3A5F',
          lineHeight: 1.15,
          textShadow: '0 2px 4px rgba(0,0,0,0.05)',
          fontFamily: "'Inter', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}>
          论文工具箱
        </h1>
        <p style={{
          fontSize: '1.0625rem',
          color: '#475569',
          fontWeight: 400,
          marginTop: 15,
          marginBottom: 0,
          maxWidth: 520,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          从 PDF 处理、写作辅助、文献引用到图表公式——覆盖论文全流程的一站式工具集
        </p>
      </div>

      {/* Privacy banner */}
      <div className="max-w-2xl mx-auto" style={{ marginBottom: 44 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 11,
          padding: '15px 18px',
          background: 'linear-gradient(135deg, rgba(30,58,95,0.03), rgba(59,130,246,0.04))',
          border: '1px solid rgba(30,58,95,0.08)',
          borderRadius: 12,
        }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: 'rgba(30,58,95,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={15} style={{ color: '#1E3A5F' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1E3A5F', fontSize: '0.8125rem', marginBottom: 3 }}>
              无需安装，打开即用
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              所有处理均在浏览器本地完成，<span style={{ fontWeight: 500, color: '#1E3A5F' }}>文件不会被上传到任何服务器</span>。保护未发表论文的安全，是我们的第一优先级。
            </p>
          </div>
        </div>
      </div>

      {/* Category cards - click to navigate */}
      <div className="max-w-3xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {categories.map(cat => (
          <Link
            key={cat.id}
            to={cat.to}
            style={{
              display: 'flex', alignItems: 'center', gap: 13,
              padding: '18px',
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.04)',
              textDecoration: 'none',
              textAlign: 'left',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{
              width: 44, height: 44,
              borderRadius: 14,
              background: cat.iconBg,
              border: `1px solid ${cat.iconBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <cat.icon size={22} strokeWidth={1.5} style={{ color: cat.iconColor }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1E3A5F' }}>{cat.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 500,
                    padding: '2px 10px', borderRadius: 999,
                    background: cat.badgeBg, color: cat.badgeColor,
                  }}>
                    {cat.count} 个工具
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 500,
                    padding: '2px 10px', borderRadius: 999,
                    background: 'rgba(30,58,95,0.05)', color: '#1E3A5F',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Lock size={10} />纯本地
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>{cat.desc}</p>
            </div>
            <div style={{ flexShrink: 0, color: '#94A3B8' }}>
              <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom hint */}
      <div className="text-center mt-10 text-xs text-[#9CA3AF]">
        你的数据不会离开浏览器，所有处理均在本地完成
      </div>
    </div>
  )
}
