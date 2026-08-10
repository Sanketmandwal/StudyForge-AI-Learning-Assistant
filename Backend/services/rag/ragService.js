import {
    retrieveRelevantChunks
} from "./retrievalService.js";

import {
    generateAnswer
} from "./generationService.js";

export const answerQuestion = async ({
    query,
    documentId,
    userId,
    topK = 5
}) => {
    const chunks =
        await retrieveRelevantChunks({
            query,
            documentId,
            userId,
            topK
        });

    if (!chunks.length) {
        return {
            answer:
                "I couldn't find relevant information about that in this document.",

            sources: []
        };
    }

    const result =
        await generateAnswer({
            query,
            chunks
        });

    return {
        answer:
            result.answer,

        sources:
            result.sources
    };
};
