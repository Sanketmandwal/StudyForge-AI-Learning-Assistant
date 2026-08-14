import React, { useCallback, useEffect, useState } from "react";
import documentService from "../../services/documentService.js";
import Spinner from "../../components/common/Spinner.jsx";
import toast from "react-hot-toast";
import Button from "../../components/common/Button.jsx";
import DocumentCard from "../../components/documents/DocumentCard.jsx";
import {
    Upload,
    FileText,
    X,
    FolderOpen,
    Plus
} from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const POLLING_INTERVAL = 5000; // 5 seconds

const DocumentListPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Upload state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploading, setUploading] = useState(false);

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Retry state
    const [retrying, setRetrying] = useState(null);

    /*
     * ---------------------------------------------------------
     * FETCH DOCUMENTS
     * ---------------------------------------------------------
     */

    const fetchDocuments = useCallback(async (showLoader = true) => {
        if (showLoader) {
            setLoading(true);
        }

        try {
            const data = await documentService.getDocuments();
            console.log(data)
            setDocuments(
                Array.isArray(data?.data)
                    ? data.data
                    : []
            );
        } catch (error) {
            toast.error(
                error?.message || "Failed to fetch documents"
            );
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, []);

    /*
     * ---------------------------------------------------------
     * INITIAL LOAD
     * ---------------------------------------------------------
     */

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    /*
     * ---------------------------------------------------------
     * POLL PROCESSING DOCUMENTS
     *
     * Why?
     *
     * Upload API returns immediately with:
     *
     *     status = "processing"
     *
     * BullMQ worker processes the document in the background.
     *
     * We periodically fetch documents so the UI changes:
     *
     *     processing -> ready
     *
     * or
     *
     *     processing -> failed
     * ---------------------------------------------------------
     */

    useEffect(() => {
        const hasProcessingDocuments = documents.some(
            (document) => document.status === "processing"
        );

        if (!hasProcessingDocuments) {
            return;
        }

        const interval = setInterval(() => {
            fetchDocuments(false);
        }, POLLING_INTERVAL);

        return () => {
            clearInterval(interval);
        };
    }, [documents, fetchDocuments]);

    /*
     * ---------------------------------------------------------
     * FILE VALIDATION
     * ---------------------------------------------------------
     */

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // Backend currently supports PDF processing only.
        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            toast.error("Please upload a PDF file only");

            // Reset input so the same file can be selected again.
            e.target.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be less than 10MB");

            e.target.value = "";
            return;
        }

        setUploadFile(file);

        // Automatically use filename as default title.
        setUploadTitle(
            file.name.replace(/\.[^/.]+$/, "")
        );
    };

    /*
     * ---------------------------------------------------------
     * UPLOAD DOCUMENT
     * ---------------------------------------------------------
     */

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!uploadFile) {
            toast.error("Please select a PDF file");
            return;
        }

        if (!uploadTitle.trim()) {
            toast.error("Please provide a document title");
            return;
        }

        setUploading(true);

        const formData = new FormData();

        formData.append("file", uploadFile);
        formData.append("title", uploadTitle.trim());

        try {
            await documentService.uploadDocument(formData);

            /*
             * Important:
             *
             * Upload success does NOT mean processing is complete.
             *
             * The API only confirms:
             *
             * Cloudinary upload
             *       +
             * MongoDB document creation
             *       +
             * BullMQ job creation
             *
             * Processing happens asynchronously.
             */

            toast.success(
                "Document uploaded. Processing has started."
            );

            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadTitle("");

            // Refresh immediately so processing document appears.
            await fetchDocuments(false);
        } catch (error) {
            toast.error(
                error?.message || "Failed to upload document"
            );
        } finally {
            setUploading(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * RETRY DOCUMENT PROCESSING
     * ---------------------------------------------------------
     */

    const handleRetry = async (documentId) => {
        if (!documentId) {
            toast.error("Invalid document");
            return;
        }

        if (retrying) {
            return;
        }

        setRetrying(documentId);

        try {
            await documentService.retryDocumentProcessing(
                documentId
            );

            toast.success(
                "Document processing restarted."
            );

            /*
             * The backend should change:
             *
             * failed -> processing
             *
             * and create a new BullMQ job.
             */

            await fetchDocuments(false);
        } catch (error) {
            toast.error(
                error?.message ||
                "Failed to restart document processing"
            );
        } finally {
            setRetrying(null);
        }
    };

    /*
     * ---------------------------------------------------------
     * DELETE REQUEST
     * ---------------------------------------------------------
     */

    const handleDeleteRequest = (doc) => {
        setSelectedDoc(doc);
        setIsDeleteModalOpen(true);
    };

    /*
     * ---------------------------------------------------------
     * CONFIRM DELETE
     * ---------------------------------------------------------
     */

    const handleConfirmDelete = async () => {
        if (!selectedDoc) {
            toast.error("No document selected");
            return;
        }

        setDeleting(true);

        try {
            await documentService.deleteDocument(
                selectedDoc._id
            );

            toast.success(
                "Document deleted successfully"
            );

            setDocuments((currentDocuments) =>
                currentDocuments.filter(
                    (doc) => doc._id !== selectedDoc._id
                )
            );

            setIsDeleteModalOpen(false);
            setSelectedDoc(null);
        } catch (error) {
            toast.error(
                error?.message ||
                "Failed to delete document"
            );
        } finally {
            setDeleting(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * CLOSE UPLOAD MODAL
     * ---------------------------------------------------------
     */

    const handleCloseUploadModal = () => {
        if (uploading) {
            return;
        }

        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadTitle("");
    };

    /*
     * ---------------------------------------------------------
     * CLOSE DELETE MODAL
     * ---------------------------------------------------------
     */

    const handleCloseDeleteModal = () => {
        if (deleting) {
            return;
        }

        setIsDeleteModalOpen(false);
        setSelectedDoc(null);
    };

    /*
     * ---------------------------------------------------------
     * RENDER DOCUMENT CONTENT
     * ---------------------------------------------------------
     */

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Spinner
                        variant="pulse"
                        size="large"
                    />
                </div>
            );
        }

        if (
            !Array.isArray(documents) ||
            documents.length === 0
        ) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                        <FolderOpen className="w-10 h-10 text-gray-400" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No documents yet
                    </h3>

                    <p className="text-gray-500 text-center mb-6 max-w-md">
                        Upload your first document to get
                        started with AI-powered summaries,
                        flashcards, quizzes, and document
                        chat.
                    </p>

                    <Button
                        onClick={() =>
                            setIsUploadModalOpen(true)
                        }
                        leftIcon={
                            <Upload className="w-4 h-4" />
                        }
                        size="lg"
                    >
                        Upload Your First Document
                    </Button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <DocumentCard
                        key={doc._id}
                        document={doc}
                        onDelete={handleDeleteRequest}
                        onRetry={handleRetry}
                        retrying={retrying === doc._id}
                    />
                ))}
            </div>
        );
    };

    /*
     * ---------------------------------------------------------
     * MAIN UI
     * ---------------------------------------------------------
     */

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        My Documents
                    </h1>

                    <p className="text-gray-600">
                        {documents.length > 0
                            ? `${documents.length} document${
                                documents.length !== 1
                                    ? "s"
                                    : ""
                            } in your library`
                            : "Your document library is empty"}
                    </p>
                </div>

                <Button
                    onClick={() =>
                        setIsUploadModalOpen(true)
                    }
                    leftIcon={
                        <Plus className="w-4 h-4" />
                    }
                    size="lg"
                >
                    Upload Document
                </Button>
            </div>

            {/* Documents */}
            {renderContent()}

            {/* =====================================================
                UPLOAD MODAL
            ====================================================== */}

            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* Close */}
                        <button
                            type="button"
                            onClick={handleCloseUploadModal}
                            disabled={uploading}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        {/* Header */}
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Upload Document
                            </h2>

                            <p className="text-gray-600 text-sm">
                                Upload a PDF file. Maximum
                                file size is 10MB.
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleUpload}
                            className="space-y-5"
                        >

                            {/* File */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Choose PDF
                                </label>

                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,application/pdf"
                                        disabled={uploading}
                                        className="hidden"
                                        id="file-upload"
                                    />

                                    <label
                                        htmlFor="file-upload"
                                        className={`flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed rounded-xl transition-all ${
                                            uploadFile
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                                        } ${
                                            uploading
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer"
                                        }`}
                                    >
                                        {uploadFile ? (
                                            <>
                                                <FileText className="w-8 h-8 text-blue-600" />

                                                <div className="text-left min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate max-w-xs">
                                                        {uploadFile.name}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {(
                                                            uploadFile.size /
                                                            1024 /
                                                            1024
                                                        ).toFixed(2)}{" "}
                                                        MB
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 text-gray-400" />

                                                <div className="text-center">
                                                    <p className="font-medium text-gray-700">
                                                        Click to browse
                                                    </p>

                                                    <p className="text-xs text-gray-500 mt-1">
                                                        PDF files only
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Document Title
                                </label>

                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={(e) =>
                                        setUploadTitle(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter document title"
                                    disabled={uploading}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all disabled:opacity-50"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={
                                        handleCloseUploadModal
                                    }
                                    disabled={uploading}
                                    fullWidth
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    isLoading={uploading}
                                    disabled={
                                        !uploadFile ||
                                        !uploadTitle.trim() ||
                                        uploading
                                    }
                                    fullWidth
                                >
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =====================================================
                DELETE CONFIRMATION MODAL
            ====================================================== */}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-6 h-6 text-red-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Delete Document?
                            </h2>

                            <p className="text-gray-600">
                                Are you sure you want to
                                delete{" "}
                                <span className="font-semibold">
                                    "{selectedDoc?.title}"
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={
                                    handleCloseDeleteModal
                                }
                                disabled={deleting}
                                fullWidth
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="danger"
                                onClick={
                                    handleConfirmDelete
                                }
                                isLoading={deleting}
                                disabled={deleting}
                                fullWidth
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentListPage;