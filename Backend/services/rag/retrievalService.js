import { getQdrantStore } from "../../config/qdrant.js";

const DEFAULT_TOP_K = 5;
const MIN_RELEVANCE_SCORE = 0.60;

export const retrieveRelevantChunks = async ({
    query,
    documentId,
    userId,
    topK = DEFAULT_TOP_K
}) => {
    if (!query?.trim()) {
        throw new Error(
            "Query is required for retrieval"
        );
    }

    if (!documentId) {
        throw new Error(
            "Document ID is required for retrieval"
        );
    }

    if (!userId) {
        throw new Error(
            "User ID is required for retrieval"
        );
    }

    const vectorStore =
        await getQdrantStore();

    const results =
        await vectorStore.similaritySearchWithScore(
            query,
            topK,
            {
                must: [
                    {
                        key: "metadata.documentId",
                        match: {
                            value:
                                documentId.toString()
                        }
                    },
                    {
                        key: "metadata.userId",
                        match: {
                            value:
                                userId.toString()
                        }
                    }
                ]
            }
        );

    const relevantResults =
        results.filter(
            ([, score]) =>
                score >= MIN_RELEVANCE_SCORE
        );

    return relevantResults.map(
        ([document, score]) => ({
            content:
                document.pageContent,

            score,

            pageNumber:
                document.metadata.pageNumber,

            chunkIndex:
                document.metadata.chunkIndex,

            documentId:
                document.metadata.documentId,

            userId:
                document.metadata.userId,

            fileName:
                document.metadata.fileName
        })
    );
};

export {
    MIN_RELEVANCE_SCORE
};
