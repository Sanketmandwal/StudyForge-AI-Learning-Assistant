import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'
dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not Set up in ENV')
    process.exit(1)
}

export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
    Format each flashcard as : 
    Q: [Clear, specific question]
    A: [Concise, accurate answer]
    D: [Difficulty level: easy, medium, hard]

    Separate each flashcard with "---"

    Text:
    ${text.substring(0, 15000)}
    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text

        const flashcards = []
        const cards = generatedText.split('---').filter(c => c.trim())

        console.log('Split cards:', cards.length)

        for (const card of cards) {
            const lines = card.trim().split('\n')
            let question = '', answer = '', difficulty = 'medium'

            for (const line of lines) {
                const trimmedLine = line.trim() // Important: trim the line first!
                
                // Check for Q: or Q : (with or without space)
                if (trimmedLine.startsWith('Q:') || trimmedLine.startsWith('Q :')) {
                    // Handle both "Q:" and "Q :"
                    question = trimmedLine.includes(':') 
                        ? trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim()
                        : '';
                } 
                // Check for A: or A : (with or without space)
                else if (trimmedLine.startsWith('A:') || trimmedLine.startsWith('A :')) {
                    answer = trimmedLine.includes(':')
                        ? trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim()
                        : '';
                } 
                // Check for D: or D : (with or without space)
                else if (trimmedLine.startsWith('D:') || trimmedLine.startsWith('D :')) {
                    const diffText = trimmedLine.includes(':')
                        ? trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim().toLowerCase()
                        : 'medium';
                    
                    if (['easy', 'medium', 'hard'].includes(diffText)) {
                        difficulty = diffText;
                    }
                }
            }

            if (question && answer) {
                console.log('Parsed card:', { 
                    question: question.substring(0, 50), 
                    answer: answer.substring(0, 50), 
                    difficulty 
                });
                flashcards.push({ question, answer, difficulty })
            } else {
                console.log('Skipped card:', { hasQuestion: !!question, hasAnswer: !!answer });
            }
        }

        console.log("Total flashcards parsed:", flashcards.length)
        console.log("Returning flashcards:", flashcards.slice(0, count).length)

        return flashcards.slice(0, count)
    } catch (error) {
        console.error('Gemini API Error:', error)
        throw new Error('Failed to generate flashcards: ' + error.message)
    }
}



export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
Format each question as:
Q: [Question]
O1: [Option 1]
O2: [Option 2]
O3: [Option 3]
O4: [Option 4]
C: [Correct Option - exactly written as O1, O2, O3, or O4]
E: [Brief Explanation]
D: [Difficulty level: easy, medium, hard]

Separate each question with "---"

Text:
${text.substring(0, 15000)}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        });

        const generatedText = response.text;

        const questions = [];
        const questionBlocks = generatedText.split('---').filter(q => q.trim());

        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');

            let question = '';
            let options = [];
            let correctAnswer = '';
            let explanation = '';
            let difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                }
                else if (trimmed.startsWith('O1:')) {
                    options[0] = trimmed.substring(3).trim();
                }
                else if (trimmed.startsWith('O2:')) {
                    options[1] = trimmed.substring(3).trim();
                }
                else if (trimmed.startsWith('O3:')) {
                    options[2] = trimmed.substring(3).trim();
                }
                else if (trimmed.startsWith('O4:')) {
                    options[3] = trimmed.substring(3).trim();
                }
                else if (trimmed.startsWith('C:')) {
                    const correctKey = trimmed.substring(2).trim();
                    const indexMap = { O1: 0, O2: 1, O3: 2, O4: 3 };
                    if (indexMap[correctKey] !== undefined) {
                        correctAnswer = options[indexMap[correctKey]];
                    }
                }
                else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                }
                else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            // ✅ Validation gate (VERY IMPORTANT)
            if (
                question &&
                options.length === 4 &&
                options.every(Boolean) &&
                correctAnswer
            ) {
                questions.push({
                    question,
                    options,
                    correctAnswer,
                    explanation,
                    difficulty
                });
            }
        }

        return questions.slice(0, numQuestions);

    } catch (error) {
        console.error('Gemini API Error', error);
        throw new Error('Failed to generate quizzes');
    }
};


export const generateSummary = async (text) => {
    const prompt = `Provide a Concise summary of the following text , highlighting the key concepts , main ideas, and important points
    Keep the summary clear and structured

    Text:
    ${text.substring(0, 15000)}
    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text

        return generatedText
    } catch (error) {
        console.error('Gemini API Error')
        throw new Error('failed to generate summary')
    }
}

export const chatWithContext = async (questions, chunks) => {
    const context = chunks.map((c, i) => `[Chunks ${i + 1}]\n${c.content}`).join('\n\n')


    const prompt = `Based on the following context from a document , Analyse the context and the answer the user's question and provide a nice answer to the question.
    If the answer is not in the context, Say so
    
    Context : ${context},
    Question : ${questions},

    Answer :
    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text

        return generatedText
    } catch (error) {
        console.error('Gemini API Error')
        throw new Error('failed to generate answer to the chat question')
    }
}

export const explainConcept = async (concept, context) => {
    const prompt = `Explain the concept of the ${concept} based on the following context.
    Provide a clear , educational explantion that's easy to understand
    Include examples if relevant
    
    Context : 
    ${context.substring(0, 10000)}
    `

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text

        return generatedText
    } catch (error) {
        console.error('Gemini API Error')
        throw new Error('failed to Explain concept')
    }
}