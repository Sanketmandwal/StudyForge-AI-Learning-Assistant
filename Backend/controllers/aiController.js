import Flashcard from "../models/Flashcard.js";
import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { answerQuestion } from "../services/rag/ragService.js";

/* ---------------- FLASHCARDS ---------------- */

export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentId, count = 10 } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please Provide documentId"
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: "ready"
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document Not Found or Not Ready"
            });
        }

        const cards = await geminiService.generateFlashcards(
            document.extractedText,
            parseInt(count)
        );

        const flashcardSet = await Flashcard.create({
            userId: req.user._id,
            documentId: document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });

        res.status(200).json({
            success: true,
            data: flashcardSet,
            message: "Flashcards generated successfully"
        });
    } catch (error) {
        next(error);
    }
};


/* ---------------- QUIZ GENERATION ---------------- */

export const generateQuiz = async (req, res, next) => {
    try {
        const {
            documentId,
            numQuestions = 5,
            title = "Quiz"
        } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please Provide documentId"
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: "ready"
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document Not Found or Not Ready"
            });
        }

        const questions = await geminiService.generateQuiz(
            document.extractedText,
            parseInt(numQuestions)
        );

        const quiz = await Quiz.create({
            userId: req.user._id,
            documentId: document._id,
            title,
            questions,
            totalQuestions: questions.length,
            userAnswers: [],
            score: 0
        });

        res.status(200).json({
            success: true,
            data: quiz,
            message: "Quiz generated successfully"
        });
    } catch (error) {
        next(error);
    }
};


/* ---------------- SUMMARY GENERATION ---------------- */

export const generateSummary = async (req, res, next) => {
    try {
        const { documentId } = req.body;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "Please Provide documentId"
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: "ready"
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document Not Found or Not Ready"
            });
        }

        const summary = await geminiService.generateSummary(
            document.extractedText
        );

        res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                title: document.title,
                summary
            },
            message: "Summary generated successfully"
        });
    } catch (error) {
        next(error);
    }
};


/* ---------------- DOCUMENT-BASED CHAT (RAG) ---------------- */

export const chat = async (req, res, next) => {
    try {
        const {
            documentId,
            question
        } = req.body;

        if (!documentId || !question?.trim()) {
            return res.status(400).json({
                success: false,
                error: "documentId and question are required"
            });
        }

        /*
         * Verify that the document belongs to the
         * authenticated user and is ready.
         */
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: "ready"
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document Not Found or Not Ready"
            });
        }

        /*
         * ==========================================
         * REAL RAG PIPELINE
         * ==========================================
         *
         * Question
         *    ↓
         * Gemini Embedding
         *    ↓
         * Qdrant
         *    ↓
         * documentId + userId filtering
         *    ↓
         * similarity threshold
         *    ↓
         * relevant chunks
         *    ↓
         * Gemini
         *    ↓
         * grounded answer
         */

        const ragResult = await answerQuestion({
            query: question.trim(),
            documentId: document._id,
            userId: req.user._id,
            topK: Number(process.env.RAG_TOP_K) || 5
        });

        /*
         * Get or create chat history.
         */
        let chatHistory = await ChatHistory.findOne({
            userId: req.user._id,
            documentId: document._id
        });

        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                userId: req.user._id,
                documentId: document._id,
                messages: []
            });
        }

        /*
         * Extract chunk indices so the existing
         * frontend can continue using relevantChunks.
         */
        const chunkIndices = ragResult.sources.map(
            source => source.chunkIndex
        );

        /*
         * Save user question and AI answer.
         */
        chatHistory.messages.push(
            {
                role: "user",
                content: question.trim(),
                timestamp: new Date(),
                relevantChunks: []
            },
            {
                role: "assistant",
                content: ragResult.answer,
                timestamp: new Date(),
                relevantChunks: chunkIndices
            }
        );

        await chatHistory.save();

        /*
         * Return the answer along with source metadata.
         */
        return res.status(200).json({
            success: true,
            data: {
                answer: ragResult.answer,
                question: question.trim(),

                /*
                 * Kept for backward compatibility
                 * with the existing frontend.
                 */
                relevantChunks: chunkIndices,

                /*
                 * New RAG source information.
                 */
                sources: ragResult.sources,

                chatHistoryId: chatHistory._id
            },
            message: "Response Generated Successfully"
        });

    } catch (error) {
        next(error);
    }
};


/* ---------------- EXPLAIN CONCEPT ---------------- */

export const explainConcept = async (req, res, next) => {
    try {
        const {
            documentId,
            concept
        } = req.body;

        if (!documentId || !concept?.trim()) {
            return res.status(400).json({
                success: false,
                error: "documentId and concept are required"
            });
        }

        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id,
            status: "ready"
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document Not Found or Not Ready"
            });
        }

        /*
         * This endpoint is still using the old
         * chunk retrieval mechanism.
         *
         * We can migrate this to Qdrant separately.
         */
        const context = document.chunks
            .slice(0, 3)
            .map(chunk => chunk.content)
            .join("\n\n");

        const explanation =
            await geminiService.explainConcept(
                concept,
                context
            );

        res.status(200).json({
            success: true,
            data: {
                concept,
                explanation,
                relevantChunks: []
            },
            message: "Explanation Generated Successfully"
        });

    } catch (error) {
        next(error);
    }
};


/* ---------------- CHAT HISTORY ---------------- */

export const getChatHistory = async (req, res, next) => {
    try {
        const {
            documentId
        } = req.params;

        if (!documentId) {
            return res.status(400).json({
                success: false,
                error: "documentId is required"
            });
        }

        const chatHistory = await ChatHistory.findOne({
            userId: req.user._id,
            documentId
        }).select("messages");

        if (!chatHistory) {
            return res.status(200).json({
                success: true,
                data: [],
                message:
                    "No Chat History Found for this Document"
            });
        }

        res.status(200).json({
            success: true,
            data: chatHistory.messages,
            message:
                "Chat History Retrieved Successfully"
        });

    } catch (error) {
        next(error);
    }
};
