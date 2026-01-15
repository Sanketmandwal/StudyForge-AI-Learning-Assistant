import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import aiService from '../../services/aiService'
import toast from 'react-hot-toast'
import MarkdownRenderer from '../common/MarkDownRenderer'
import Button from '../common/Button'
import {
  Sparkles,
  CreditCard,
  ClipboardCheck,
  FileText,
  Brain,
  X,
  Loader2,
  Copy,
  Check,
  Download
} from 'lucide-react'

const AIActions = () => {
  const { id: documentId } = useParams()
  const navigate = useNavigate()
  const [loadingAction, setLoadingAction] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState("")
  const [modalTitle, setModalTitle] = useState("")
  const [concept, setConcept] = useState("")
  const [isExplainFormOpen, setIsExplainFormOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateSummary = async () => {
    setLoadingAction('summary')
    try {
      const response = await aiService.generateSummary(documentId)
      const summary = response.summary || response.data?.summary || response
      setModalTitle("Document Summary")
      setModalContent(typeof summary === 'string' ? summary : JSON.stringify(summary))
      setIsModalOpen(true)
      toast.success("Summary generated successfully!")
    } catch (error) {
      console.error('Summary error:', error)
      toast.error(error.message || "Failed to generate Summary")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleExplainConcept = async (e) => {
    e.preventDefault()
    if (!concept.trim()) {
      toast.error("Please enter a concept to explain")
      return
    }
    setLoadingAction('explain')
    try {
      const response = await aiService.explainConcept(documentId, concept)
      const explanation = response.explanation || response.data?.explanation || response
      setModalTitle(`Explanation: ${concept}`)
      setModalContent(typeof explanation === 'string' ? explanation : JSON.stringify(explanation))
      setIsModalOpen(true)
      setConcept("")
      setIsExplainFormOpen(false)
      toast.success("Concept explained successfully!")
    } catch (error) {
      console.error('Explain error:', error)
      toast.error(error.message || "Failed to explain concept")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateFlashcards = async () => {
    setLoadingAction('flashcards')
    try {
      await aiService.generateFlashcard(documentId)
      toast.success("Flashcards generated successfully!")
    } catch (error) {
      console.error('Flashcards error:', error)
      toast.error(error.message || "Failed to generate flashcards")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleGenerateQuiz = async () => {
    setLoadingAction('quiz')
    try {
      const response = await aiService.generateQuiz(documentId)
      toast.success("Quiz generated successfully!")
    } catch (error) {
      console.error('Quiz error:', error)
      toast.error(error.message || "Failed to generate quiz")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(modalContent)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadAsText = () => {
    const element = document.createElement("a")
    const file = new Blob([modalContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${modalTitle.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success("Downloaded successfully!")
  }

  const actions = [
    {
      id: 'summary',
      title: 'Generate Summary',
      description: 'Get an AI-powered summary of your document in seconds',
      icon: Sparkles,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-100',
      onClick: handleGenerateSummary,
      loading: loadingAction === 'summary'
    },
    {
      id: 'explain',
      title: 'Explain Concept',
      description: 'Get detailed explanations of specific concepts',
      icon: Brain,
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-100',
      onClick: () => setIsExplainFormOpen(true),
      loading: loadingAction === 'explain'
    },
    {
      id: 'flashcards',
      title: 'Create Flashcards',
      description: 'Generate study flashcards from document content',
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-100',
      onClick: handleGenerateFlashcards,
      loading: loadingAction === 'flashcards'
    },
    {
      id: 'quiz',
      title: 'Generate Quiz',
      description: 'Create a quiz to test your knowledge',
      icon: ClipboardCheck,
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-100',
      onClick: handleGenerateQuiz,
      loading: loadingAction === 'quiz'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Actions</h2>
        <p className="text-gray-600">
          Enhance your learning experience with intelligent tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <div
              key={action.id}
              className={`relative bg-gradient-to-br ${action.bgColor} rounded-2xl p-6 border ${action.borderColor} hover:shadow-xl transition-all duration-300 group`}
            >
          
              <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-7 h-7 text-white" />
              </div>

             
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {action.description}
              </p>

              
              <Button
                onClick={action.onClick}
                disabled={action.loading || loadingAction !== null}
                isLoading={action.loading}
                variant="outline"
                size="sm"
                fullWidth
                className="group-hover:border-gray-400"
              >
                {action.loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          )
        })}
      </div>

      
      {isExplainFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => {
                setIsExplainFormOpen(false)
                setConcept("")
              }}
              disabled={loadingAction === 'explain'}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Explain Concept</h2>
            <p className="text-gray-600 text-sm mb-6">
              Enter a concept from your document that you'd like to understand better
            </p>

            <form onSubmit={handleExplainConcept} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concept or Topic
                </label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g., Quantum Entanglement"
                  disabled={loadingAction === 'explain'}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-xl outline-none transition-all disabled:opacity-50"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsExplainFormOpen(false)
                    setConcept("")
                  }}
                  disabled={loadingAction === 'explain'}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loadingAction === 'explain'}
                  disabled={!concept.trim() || loadingAction === 'explain'}
                  fullWidth
                >
                  Explain
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">AI Generated Content</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={handleDownloadAsText}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download as text"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={modalContent} />
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="secondary"
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIActions
