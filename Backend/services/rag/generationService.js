import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GOOGLE_API_KEY
});

export const generateAnswer = async ({
    query,
    chunks
}) => {
    if (!query?.trim()) {
        throw new Error(
            "Query is required"
        );
    }

    if (!chunks?.length) {
        return {
            answer:
                "I couldn't find relevant information in your document.",
            sources: []
        };
    }

    const context = chunks
        .map((chunk, index) => {
            return `
SOURCE ${index + 1}
PDF Page: ${chunk.pageNumber}
Chunk: ${chunk.chunkIndex}

${chunk.content}
`;
        })
        .join("\n--------------------\n");

    const prompt = `
You are StudyForge, an AI teaching assistant.

Answer the user's question using ONLY the provided document context.

Rules:
1. Do not use outside knowledge.
2. If the answer is not present in the context, say that the information was not found in the document.
3. Explain the answer clearly and educationally.
4. Do not mention the retrieval system, embeddings, Qdrant, or internal implementation.
5. When useful, organize the answer with bullet points or numbered steps.
6. Do not invent page numbers or facts.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${query}

ANSWER:
`;

    const response =
        await model.invoke(prompt);

    const answer =
        typeof response.content === "string"
            ? response.content
            : response.content
                  .map((item) =>
                      typeof item === "string"
                          ? item
                          : item.text || ""
                  )
                  .join("");

    const sources = chunks.map(
        (chunk) => ({
            pageNumber:
                chunk.pageNumber,

            chunkIndex:
                chunk.chunkIndex,

            fileName:
                chunk.fileName,

            score:
                chunk.score
        })
    );

    return {
        answer,
        sources
    };
};