import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import documentService from '../../services/documentService'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import Tabs from '../../components/common/Tabs.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Button from '../../components/common/Button.jsx'
import {
  ExternalLink,
  ArrowLeft,
  FileText,
  Calendar,
  HardDrive,
  MessageSquare,
  Sparkles,
  CreditCard,
  ClipboardCheck,
  Download
} from 'lucide-react'
import moment from 'moment'
import ChatInterface from '../../components/chat/ChatInterface.jsx'
import AIActions from '../../components/ai/AIActions.jsx'
import FlashcardManager from '../../components/flashcards/FlashcardManager.jsx'
import QuizManager from '../../components/quiz/QuizManager.jsx'

const DocumentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Content')

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const data = await documentService.getDocumentById(id)
        setDocument(data)
      } catch (error) {
        toast.error(error.message || "Failed to fetch document details")
        navigate('/documents')
      } finally {
        setLoading(false)
      }
    }
    fetchDocumentDetails()
  }, [id, navigate])

  const getPdfUrl = () => {
    if (!document || !document.data?.fileUrl) return null

    const fileUrl = document.data.fileUrl

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl
    }

  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  const renderContent = () => {
    if (!document || !document.data?.fileUrl) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No document available</p>
        </div>
      )
    }

    const pdfUrl = getPdfUrl()
    if (!pdfUrl) {
      return <p className="text-center text-gray-500">Invalid document URL</p>
    }

    return (
      <div className="space-y-4">
        {/* Document Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {document.data.title || 'Document'}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {moment(document.data.uploadedAt || document.data.createdAt).format('MMM DD, YYYY')}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formatFileSize(document.data.fileSize)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download
              className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          <iframe
            src={pdfUrl}
            className="w-full h-[700px]"
            title="Document Viewer"
          />
        </div>
      </div>
    )
  }

  const renderChat = () => {
    return <ChatInterface />
  }

  const renderAIActions = () => {
    return <AIActions/>
  }

  const renderFlashcardsTab = () => {
    return <FlashcardManager documentId={id}/>
  }

  const renderQuizzesTab = () => {
    return <QuizManager documentId={id} />
  }

  const tabs = [
    { name: 'Content', label: 'Content', content: renderContent() },
    { name: 'Chat', label: 'Chat', content: renderChat() },
    { name: 'AI Actions', label: 'AI Actions', content: renderAIActions() },
    { name: 'Flashcards', label: 'Flashcards', content: renderFlashcardsTab() },
    { name: 'Quizzes', label: 'Quizzes', content: renderQuizzesTab() },
  ]

  if (loading) {
    return <Spinner fullScreen={true} variant="pulse" size="large" />
  }

  if (!document) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-6">Document not found</p>
        <Button onClick={() => navigate('/documents')}>Back to Documents</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/documents"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Documents
      </Link>

      {/* Page Header */}
      <PageHeader
        title={document.data?.title || 'Document Details'}
        subtitle={`Uploaded ${moment(document.data?.uploadedAt || document.data?.createdAt).fromNow()}`}
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default DocumentDetailPage
