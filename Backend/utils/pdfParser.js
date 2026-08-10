import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (buffer) => {
    const parser = new PDFParse({
        data: buffer
    });

    try {
        const result = await parser.getText();

        const pages = result.pages
            .map((page) => ({
                pageNumber: page.num,
                text: page.text.trim()
            }))
            .filter((page) => page.text.length > 0);

        return {
            text: result.text,
            pages,
            numPages: result.total
        };
    } catch (error) {
        console.error(
            "PDF Parsing error:",
            error
        );

        throw new Error(
            "Failed to extract text from PDF"
        );
    } finally {
        await parser.destroy();
    }
};
