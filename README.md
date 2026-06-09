# 📚 论文工具箱 (Paper Toolbox)

> **一站式学术工具集 — 纯前端运行，保护隐私，无需注册**

一个基于 React + Vite 的 Web 应用，为学术论文写作提供多种实用工具，所有处理均在浏览器本地完成。

## ✨ 功能一览

| 工具 | 说明 |
|------|------|
| 📄 PDF 智能转换 | 三层混合转换模型：文字提取 / OCR 识别 / 图片型 Word |
| 📊 AI 智能分析 | 论文内容智能解读、关键信息提取 |
| 📈 数据可视化 | 多种图表类型（柱状图/折线图/饼图/雷达图/词云等） |
| 🧠 思维导图 | 自动生成论文结构思维导图 |
| 🔀 流程图 | 4 种论文级专业配色风格 |
| 📝 求信生成 | 一键生成专业求职信 |
| 🧮 字数统计 | 论文字数与段落统计 |

## 🚀 技术栈

- **前端框架**: React 19 + Vite 8
- **样式**: Tailwind CSS 4 + Lucide Icons
- **PDF 处理**: pdf.js + Tesseract.js (OCR) + pdf-lib
- **图表**: ECharts 6 + Cytoscape.js
- **文档**: JSZip (DOCX) + KaTeX (数学公式)
- **其他**: Mermaid (流程图) + XLSX (Excel) + Mammoth (Word解析)

## 🌐 在线体验

[点击访问 GitHub Pages](#) （部署后自动生成链接）

## 💡 使用说明

1. 打开网站即可使用所有工具
2. 所有处理均在**浏览器本地运行**，文件不会上传到任何服务器
3. 支持现代浏览器（Chrome / Edge / Firefox / Safari 最新版）

## 📋 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📜 License

MIT License — 自由使用和修改
