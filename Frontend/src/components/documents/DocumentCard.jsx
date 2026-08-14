import React from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
    FileText,
    Trash2,
    Eye,
    Calendar,
    HardDrive,
    CreditCard,
    ClipboardCheck,
    LoaderCircle,
    RotateCcw,
    CircleCheck,
    CircleX,
    AlertCircle
} from "lucide-react";

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "N/A";

    const units = ["B", "KB", "MB", "GB", "TB"];

    let size = bytes;
    let unitIndex = 0;

    while (
        size >= 1024 &&
        unitIndex < units.length - 1
    ) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const DocumentCard = ({
    document,
    onDelete,
    onRetry,
    retrying = false
}) => {
    const navigate = useNavigate();

    /*
     * ---------------------------------------------------------
     * DOCUMENT STATUS
     * ---------------------------------------------------------
     */

    const status = document.status || "processing";

    const isProcessing = status === "processing";
    const isReady = status === "ready";
    const isFailed = status === "failed";

    /*
     * ---------------------------------------------------------
     * NAVIGATION
     * ---------------------------------------------------------
     */

    const handleNavigate = () => {
        /*
         * Do not allow the user to open a document
         * while it is still being processed or has failed.
         *
         * RAG requires:
         *
         * PDF
         *   ↓
         * text extraction
         *   ↓
         * chunks
         *   ↓
         * embeddings
         *   ↓
         * Qdrant
         *
         * Only "ready" means the complete pipeline
         * has successfully finished.
         */

        if (!isReady) {
            return;
        }

        navigate(`/documents/${document._id}`);
    };

    /*
     * ---------------------------------------------------------
     * DELETE
     * ---------------------------------------------------------
     */

    const handleDelete = (e) => {
        e.stopPropagation();

        if (onDelete) {
            onDelete(document);
        }
    };

    /*
     * ---------------------------------------------------------
     * RETRY
     * ---------------------------------------------------------
     */

    const handleRetry = (e) => {
        e.stopPropagation();

        if (!onRetry || retrying) {
            return;
        }

        onRetry(document._id);
    };

    /*
     * ---------------------------------------------------------
     * FILE EXTENSION
     * ---------------------------------------------------------
     */

    const getFileExtension = () => {
        /*
         * Your backend uses:
         *
         * fileName
         *
         * not:
         *
         * filename
         */

        const fileName =
            document.fileName ||
            document.filename;

        if (!fileName) {
            return "PDF";
        }

        const ext = fileName
            .split(".")
            .pop()
            .toUpperCase();

        return ext || "PDF";
    };

    const fileExtension = getFileExtension();

    /*
     * ---------------------------------------------------------
     * FILE TYPE COLOR
     * ---------------------------------------------------------
     */

    const getFileTypeColor = () => {
        if (fileExtension === "PDF") {
            return "from-red-500 to-orange-500";
        }

        if (
            fileExtension === "DOC" ||
            fileExtension === "DOCX"
        ) {
            return "from-blue-500 to-cyan-500";
        }

        if (fileExtension === "TXT") {
            return "from-gray-500 to-gray-600";
        }

        return "from-purple-500 to-pink-500";
    };

    /*
     * ---------------------------------------------------------
     * STATUS UI
     * ---------------------------------------------------------
     */

    const getStatusConfig = () => {
        if (isProcessing) {
            return {
                label: "Processing",
                className:
                    "bg-yellow-50 text-yellow-700 border-yellow-200",
                icon: (
                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                )
            };
        }

        if (isReady) {
            return {
                label: "Ready",
                className:
                    "bg-green-50 text-green-700 border-green-200",
                icon: (
                    <CircleCheck className="w-3.5 h-3.5" />
                )
            };
        }

        if (isFailed) {
            return {
                label: "Processing Failed",
                className:
                    "bg-red-50 text-red-700 border-red-200",
                icon: (
                    <CircleX className="w-3.5 h-3.5" />
                )
            };
        }

        return {
            label: "Unknown",
            className:
                "bg-gray-50 text-gray-700 border-gray-200",
            icon: (
                <AlertCircle className="w-3.5 h-3.5" />
            )
        };
    };

    const statusConfig = getStatusConfig();

    /*
     * ---------------------------------------------------------
     * RENDER
     * ---------------------------------------------------------
     */

    return (
        <div
            className={`
                group
                relative
                bg-white
                rounded-2xl
                p-6
                shadow-lg
                transition-all
                duration-300
                border
                ${
                    isReady
                        ? "hover:shadow-2xl hover:border-gray-200"
                        : "border-gray-200"
                }
                ${
                    isReady
                        ? "cursor-pointer"
                        : "cursor-default"
                }
            `}
        >
            {/* Hover gradient */}
            <div
                className={`
                    absolute
                    inset-0
                    bg-gradient-to-br
                    ${getFileTypeColor()}
                    opacity-0
                    ${
                        isReady
                            ? "group-hover:opacity-5"
                            : ""
                    }
                    rounded-2xl
                    transition-opacity
                    duration-300
                `}
            />

            <div className="relative">

                {/* =================================================
                    TOP SECTION
                ================================================== */}

                <div className="flex items-start justify-between mb-4">

                    {/* File Icon */}
                    <div
                        className={`
                            w-14
                            h-14
                            bg-gradient-to-br
                            ${getFileTypeColor()}
                            rounded-xl
                            flex
                            items-center
                            justify-center
                            shadow-lg
                            ${
                                isProcessing
                                    ? "opacity-70"
                                    : ""
                            }
                        `}
                    >
                        <FileText className="w-7 h-7 text-white" />
                    </div>

                    {/* File Extension */}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                        {fileExtension}
                    </span>
                </div>

                {/* =================================================
                    TITLE
                ================================================== */}

                <h3
                    onClick={handleNavigate}
                    className={`
                        text-lg
                        font-bold
                        text-gray-900
                        mb-3
                        line-clamp-2
                        transition-colors
                        ${
                            isReady
                                ? "group-hover:text-blue-600 cursor-pointer"
                                : ""
                        }
                    `}
                >
                    {document.title ||
                        "Untitled Document"}
                </h3>

                {/* =================================================
                    STATUS
                ================================================== */}

                <div className="mb-4">

                    <div
                        className={`
                            inline-flex
                            items-center
                            gap-1.5
                            px-3
                            py-1.5
                            rounded-lg
                            border
                            text-xs
                            font-semibold
                            ${statusConfig.className}
                        `}
                    >
                        {statusConfig.icon}

                        <span>
                            {statusConfig.label}
                        </span>
                    </div>

                </div>

                {/* =================================================
                    FAILED MESSAGE
                ================================================== */}

                {isFailed && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">

                        <div className="flex items-start gap-2">

                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />

                            <div>
                                <p className="text-xs font-semibold text-red-700">
                                    Document processing failed
                                </p>

                                <p className="text-xs text-red-600 mt-1">
                                    We couldn't finish processing
                                    this document. You can try
                                    processing it again.
                                </p>
                            </div>

                        </div>

                    </div>
                )}

                {/* =================================================
                    PROCESSING MESSAGE
                ================================================== */}

                {isProcessing && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">

                        <div className="flex items-start gap-2">

                            <LoaderCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0 animate-spin" />

                            <div>
                                <p className="text-xs font-semibold text-yellow-700">
                                    Processing document
                                </p>

                                <p className="text-xs text-yellow-600 mt-1">
                                    Extracting content and
                                    generating embeddings.
                                </p>
                            </div>

                        </div>

                    </div>
                )}

                {/* =================================================
                    FLASHCARDS / QUIZZES
                ================================================== */}

                {isReady &&
                    (
                        document.flashcardCount !==
                            undefined ||
                        document.quizCount !== undefined
                    ) && (
                        <div className="flex items-center gap-3 mb-4">

                            {document.flashcardCount !==
                                undefined && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg">

                                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />

                                    <span className="text-xs font-semibold text-purple-700">
                                        {
                                            document.flashcardCount
                                        }{" "}
                                        Cards
                                    </span>

                                </div>
                            )}

                            {document.quizCount !==
                                undefined && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">

                                    <ClipboardCheck className="w-3.5 h-3.5 text-orange-600" />

                                    <span className="text-xs font-semibold text-orange-700">
                                        {document.quizCount}{" "}
                                        Quizzes
                                    </span>

                                </div>
                            )}

                        </div>
                    )}

                {/* =================================================
                    DOCUMENT INFO
                ================================================== */}

                <div className="space-y-2 mb-4">

                    <div className="flex items-center gap-2 text-sm text-gray-500">

                        <Calendar className="w-4 h-4" />

                        <span>
                            {document.uploadedAt
                                ? moment(
                                      document.uploadedAt
                                  ).format(
                                      "MMM DD, YYYY"
                                  )
                                : document.createdAt
                                ? moment(
                                      document.createdAt
                                  ).format(
                                      "MMM DD, YYYY"
                                  )
                                : "Unknown date"}
                        </span>

                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">

                        <HardDrive className="w-4 h-4" />

                        <span>
                            {formatFileSize(
                                document.fileSize
                            )}
                        </span>

                    </div>

                </div>

                <div className="border-t border-gray-100 my-4" />

                {/* =================================================
                    ACTION BUTTONS
                ================================================== */}

                <div className="flex items-center gap-2">

                    {/* READY */}
                    {isReady && (
                        <button
                            onClick={handleNavigate}
                            className="
                                flex-1
                                flex
                                items-center
                                justify-center
                                gap-2
                                px-4
                                py-2.5
                                bg-gradient-to-r
                                from-blue-500
                                to-purple-600
                                text-white
                                rounded-xl
                                font-medium
                                hover:from-blue-600
                                hover:to-purple-700
                                transition-all
                                duration-200
                                shadow-md
                                hover:shadow-lg
                            "
                        >
                            <Eye className="w-4 h-4" />

                            <span>
                                View
                            </span>
                        </button>
                    )}

                    {/* PROCESSING */}
                    {isProcessing && (
                        <div
                            className="
                                flex-1
                                flex
                                items-center
                                justify-center
                                gap-2
                                px-4
                                py-2.5
                                bg-gray-100
                                text-gray-500
                                rounded-xl
                                font-medium
                                cursor-not-allowed
                            "
                        >
                            <LoaderCircle
                                className="
                                    w-4
                                    h-4
                                    animate-spin
                                "
                            />

                            <span>
                                Processing...
                            </span>
                        </div>
                    )}

                    {/* FAILED */}
                    {isFailed && (
                        <button
                            onClick={handleRetry}
                            disabled={retrying}
                            className="
                                flex-1
                                flex
                                items-center
                                justify-center
                                gap-2
                                px-4
                                py-2.5
                                bg-gradient-to-r
                                from-orange-500
                                to-red-500
                                text-white
                                rounded-xl
                                font-medium
                                hover:from-orange-600
                                hover:to-red-600
                                transition-all
                                duration-200
                                shadow-md
                                hover:shadow-lg
                                disabled:opacity-60
                                disabled:cursor-not-allowed
                            "
                        >
                            <RotateCcw
                                className={`
                                    w-4
                                    h-4
                                    ${
                                        retrying
                                            ? "animate-spin"
                                            : ""
                                    }
                                `}
                            />

                            <span>
                                {retrying
                                    ? "Retrying..."
                                    : "Retry Processing"}
                            </span>
                        </button>
                    )}

                    {/* DELETE */}
                    <button
                        onClick={handleDelete}
                        className="
                            p-2.5
                            bg-red-50
                            text-red-600
                            rounded-xl
                            hover:bg-red-100
                            transition-colors
                        "
                        title="Delete document"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                </div>
            </div>

            {/* Top hover line */}
            <div
                className="
                    absolute
                    top-0
                    left-0
                    right-0
                    h-1
                    bg-gradient-to-r
                    from-blue-500
                    to-purple-600
                    rounded-t-2xl
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-300
                "
            />
        </div>
    );
};

export default DocumentCard;