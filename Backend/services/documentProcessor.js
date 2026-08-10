import Document from "../models/Document.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getQdrantStore } from "../config/qdrant.js";

export const processDocument = async (documentId) => {
    console.log(
        `Starting document processing: ${documentId}`
    );

    const document =
        await Document.findById(documentId);

    if (!document) {
        throw new Error(
            `Document not found: ${documentId}`
        );
    }

    try {
        /*
         * 1. Download PDF from Cloudinary
         */

        console.log(
            `Downloading PDF: ${document.fileName}`
        );

        const response =
            await fetch(document.fileUrl);

        if (!response.ok) {
            throw new Error(
                `Failed to download PDF: ${response.status} ${response.statusText}`
            );
        }

        const buffer =
            Buffer.from(
                await response.arrayBuffer()
            );

        console.log(
            `Downloaded ${(
                buffer.length /
                1024 /
                1024
            ).toFixed(2)} MB`
        );

        /*
         * 2. Extract page-aware text
         */

        const {
            text,
            pages,
            numPages
        } = await extractTextFromPDF(
            buffer
        );

        if (!text || !text.trim()) {
            throw new Error(
                "No text could be extracted from PDF"
            );
        }

        console.log(
            `PDF contains ${numPages} pages`
        );

        console.log(
            `Extracted text from ${pages.length} pages`
        );

        /*
         * 3. Convert pages into LangChain documents
         */

        const pageDocuments =
            pages.map((page) => ({
                pageContent: page.text,

                metadata: {
                    documentId:
                        documentId.toString(),

                    userId:
                        document.userId.toString(),

                    fileName:
                        document.fileName,

                    pageNumber:
                        page.pageNumber
                }
            }));

        /*
         * 4. Split documents into chunks
         */

        const splitter =
            new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
            });

        const chunks =
            await splitter.splitDocuments(
                pageDocuments
            );

        console.log(
            `Created ${chunks.length} chunks`
        );

        /*
         * 5. Add chunk index
         */

        chunks.forEach(
            (chunk, index) => {
                chunk.metadata.chunkIndex =
                    index;
            }
        );

        /*
         * 6. Connect to Qdrant
         */

        console.log(
            "Connecting to Qdrant..."
        );

        const vectorStore =
            await getQdrantStore();

        /*
         * 7. Generate embeddings and
         *    insert chunks into Qdrant
         */

        console.log(
            "Generating embeddings and indexing chunks..."
        );

        await vectorStore.addDocuments(
            chunks
        );

        console.log(
            `Indexed ${chunks.length} chunks into Qdrant`
        );

        /*
         * 8. Store extracted text temporarily
         *
         * We keep this for now because other
         * StudyForge features may still use it.
         *
         * Later we can remove the chunks array
         * from MongoDB after fully migrating
         * retrieval to Qdrant.
         */

        const mongoChunks =
            chunks.map((chunk) => ({
                content:
                    chunk.pageContent,

                pageNumber:
                    chunk.metadata.pageNumber,

                chunkIndex:
                    chunk.metadata.chunkIndex
            }));

        await Document.findByIdAndUpdate(
            documentId,
            {
                extractedText: text,

                chunks: mongoChunks,

                status: "ready"
            }
        );

        console.log(
            `Document ${documentId} processed successfully`
        );

        return {
            documentId:
                documentId.toString(),

            pages: numPages,

            chunks:
                chunks.length,

            status: "ready"
        };
    } catch (error) {
        console.error(
            `Document processing failed: ${documentId}`,
            error
        );

        await Document.findByIdAndUpdate(
            documentId,
            {
                status: "failed"
            }
        );

        throw error;
    }
};
