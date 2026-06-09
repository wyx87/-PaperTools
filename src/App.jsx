import { Routes, Route } from 'react-router-dom'
import { TaskProvider } from './contexts/TaskContext'
import { ProcessingGuardProvider } from './contexts/ProcessingGuardContext'
import Layout from './components/Layout'
import Home from './pages/Home'

// PDF 模块
import PdfHome from './pages/PdfHome'
import PdfMergePage from './pages/PdfMergePage'
import PdfSplitPage from './pages/PdfSplitPage'
import PdfCompressPage from './pages/PdfCompressPage'
import PdfToImagePage from './pages/PdfToImagePage'
import PdfRotateDeletePage from './pages/PdfRotateDeletePage'
import PdfToWordPage from './pages/PdfToWordPage'

// 写作辅助模块
import WritingHome from './pages/WritingHome'
import WordCountPage from './pages/WordCountPage'
import PunctuationPage from './pages/PunctuationPage'
import PhrasesPage from './pages/PhrasesPage'
import CleanerPage from './pages/CleanerPage'

// 文献与引用模块
import ReferenceHome from './pages/ReferenceHome'
import ReferenceGenerator from './pages/ReferenceGenerator'
import SortAuthorsPage from './pages/SortAuthorsPage'

// 图表·表格模块
import ChartHome from './pages/ChartHome'
import BarChartPage from './pages/BarChartPage'
import LineChartPage from './pages/LineChartPage'
import PieChartPage from './pages/PieChartPage'
import ScatterChartPage from './pages/ScatterChartPage'
import RadarChartPage from './pages/RadarChartPage'
import AreaChartPage from './pages/AreaChartPage'
import ComboChartPage from './pages/ComboChartPage'
import TablePage from './pages/TablePage'
import FlowchartPage from './pages/FlowchartPage'
import MindmapPage from './pages/MindmapPage'

// 投稿检查模块
import SubmitHome from './pages/SubmitHome'
import CoverLetterPage from './pages/CoverLetterPage'
import ReviewResponsePage from './pages/ReviewResponsePage'
import SubmissionChecklistPage from './pages/SubmissionChecklistPage'

// 分类目录页
import CategoryPage from './pages/CategoryPage'

export default function App() {
  return (
    <TaskProvider>
      <ProcessingGuardProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />

          {/* 分类目录页（首页卡片点击跳转） */}
          <Route path="category/:id" element={<CategoryPage />} />

          {/* PDF 模块 */}
          <Route path="pdf" element={<PdfHome />} />
          <Route path="pdf/merge" element={<PdfMergePage />} />
          <Route path="pdf/split" element={<PdfSplitPage />} />
          <Route path="pdf/compress" element={<PdfCompressPage />} />
          <Route path="pdf/to-image" element={<PdfToImagePage />} />
          <Route path="pdf/rotate-delete" element={<PdfRotateDeletePage />} />
          <Route path="pdf/to-word" element={<PdfToWordPage />} />

          {/* 写作辅助模块 */}
          <Route path="writing" element={<WritingHome />} />
          <Route path="writing/word-count" element={<WordCountPage />} />
          <Route path="writing/punctuation" element={<PunctuationPage />} />
          <Route path="writing/phrases" element={<PhrasesPage />} />
          <Route path="writing/cleaner" element={<CleanerPage />} />

          {/* 文献与引用模块 */}
          <Route path="reference" element={<ReferenceHome />} />
          <Route path="reference/generator" element={<ReferenceGenerator />} />
          <Route path="reference/sort-authors" element={<SortAuthorsPage />} />

          {/* 图表·表格·公式模块 */}
          <Route path="chart" element={<ChartHome />} />
          <Route path="chart/bar" element={<BarChartPage />} />
          <Route path="chart/line" element={<LineChartPage />} />
          <Route path="chart/pie" element={<PieChartPage />} />
          <Route path="chart/scatter" element={<ScatterChartPage />} />
          <Route path="chart/radar" element={<RadarChartPage />} />
          <Route path="chart/area" element={<AreaChartPage />} />
          <Route path="chart/combo" element={<ComboChartPage />} />
          <Route path="chart/table" element={<TablePage />} />
          <Route path="chart/flowchart" element={<FlowchartPage />} />
          <Route path="chart/mindmap" element={<MindmapPage />} />

          {/* 投稿检查模块 */}
          <Route path="submit" element={<SubmitHome />} />
          <Route path="submit/cover-letter" element={<CoverLetterPage />} />
          <Route path="submit/review-response" element={<ReviewResponsePage />} />
          <Route path="submit/checklist" element={<SubmissionChecklistPage />} />
        </Route>
      </Routes>
    </ProcessingGuardProvider>
    </TaskProvider>
  )
}
