import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import { cloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";
import path from "path";
import { documentQueue } from "../queues/documentQueue.js";
import { randomUUID } from "crypto";

const uploadBufferToCloudinary = (buffer, originalName) => {
    return new Promise((resolve, reject) => {
        const safeFileName = path
            .parse(originalName)
            .name
            .replace(/[^a-zA-Z0-9_-]/g, "_");

        const publicId = `studyforge/documents/${randomUUID()}-${safeFileName}.pdf`;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                public_id: publicId
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
};

export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No file uploaded"
            });
        }

        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: "Please provide a document title",
                statusCode: 400
            });
        }

        // Upload PDF to Cloudinary
        const cloudinaryFile = await uploadBufferToCloudinary(
            req.file.buffer,
            req.file.originalname
        );

        // Create document metadata in MongoDB
        const document = await Document.create({
            userId: req.user._id,
            title: title.trim(),
            fileName: req.file.originalname,

            cloudinaryPublicId: cloudinaryFile.public_id,
            fileUrl: cloudinaryFile.secure_url,

            fileSize: req.file.size,

            status: "processing"
        });

        // Add document processing job to BullMQ
        const job = await documentQueue.add(
            "process-document",
            {
                documentId: document._id.toString()
            }
        );

        console.log(
            `Document processing job added: ${job.id}`
        );

        return res.status(201).json({
            success: true,
            data: document,
            message:
                "Document uploaded successfully. Processing in progress."
        });
    } catch (error) {
        next(error);
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "flashcards",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "flashcardSets"
                }
            },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "_id",
                    foreignField: "documentId",
                    as: "quizzes"
                }
            },
            {
                $addFields: {
                    flashcardCount: {
                        $size: "$flashcardSets"
                    },
                    quizCount: {
                        $size: "$quizzes"
                    }
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardSets: 0,
                    quizzes: 0
                }
            },
            {
                $sort: {
                    uploadDate: -1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        next(error);
    }
};

export const getDocument = async (req, res, next) => {
    try {
        const { id } = req.params;

        const document = await Document.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found",
                statusCode: 404
            });
        }

        const flashcardCount = await Flashcard.countDocuments({
            documentId: document._id,
            userId: req.user._id
        });

        const quizCount = await Quiz.countDocuments({
            documentId: document._id,
            userId: req.user._id
        });

        document.lastAccessed = new Date();
        await document.save();

        const documentData = document.toObject();

        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        return res.status(200).json({
            success: true,
            data: documentData
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found",
                statusCode: 404
            });
        }

        if (document.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(
                document.cloudinaryPublicId,
                {
                    resource_type: "raw"
                }
            );
        }

        await document.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Document deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const retryDocumentProcessing = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document not found"
            });
        }

        if (document.status !== "failed") {
            return res.status(400).json({
                success: false,
                error: "Only failed documents can be retried"
            });
        }

        const job = await documentQueue.add(
            "process-document",
            {
                documentId: document._id.toString()
            }
        );

        document.status = "processing";
        await document.save();

        return res.status(200).json({
            success: true,
            data: {
                documentId: document._id,
                status: "processing",
                jobId: job.id
            },
            message: "Document processing restarted"
        });

    } catch (error) {
        next(error);
    }
};