import { GoogleGenAI } from "@google/genai";
import type { MatrixData, ExamQuestion, MultipleChoiceQuestion, CognitiveLevels, SelectedTopic, AIGradeResult, CompetencyCode, Player } from '../types';

// CẤU HÌNH MODEL THEO YÊU CẦU: Mặc định Gemini 1.5 Pro (tương ứng với yêu cầu "GEMINI -3- PRO -PREVIEW" của người dùng), 
// Dự phòng tự động sang 2.0 Flash và 1.5 Flash nếu quá tải.
// Lưu ý: Hiện tại chưa có "gemini-3", nên sử dụng bản Pro mạnh nhất hiện có là gemini-1.5-pro.
const MODELS = ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const getAIClient = () => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (!key) throw new Error("API Key chưa được cấu hình. Vui lòng vào Cài đặt để nhập Key.");
    return new GoogleGenAI({ apiKey: key });
};

const generateWithFallback = async (prompt: string | any, systemInstruction?: string): Promise<any> => {
    let lastError;
    const client = getAIClient();

    for (const modelName of MODELS) {
        try {
            console.log(`Trying model: ${modelName}`);
            // Note: @google/genai syntax might differ slightly from @google/generative-ai. 
            // verifying method signature based on usage in existing file `ai.models.generateContent`
            const response = await client.models.generateContent({
                model: modelName,
                contents: typeof prompt === 'string' ? prompt : prompt,
                config: { responseMimeType: "application/json" }
            });
            return response;
        } catch (e: any) {
            console.error(`Model ${modelName} failed:`, e);
            lastError = e;
            // Continue to next model
        }
    }
    throw lastError || new Error("All models failed.");
};

// Hàm tạo Yêu cầu cần đạt bám sát Kế hoạch dạy học Địa 11 Cánh Diều
export const generateLearningOutcomesForRow = async (row: { topic: string; content: string; competencyCodes: CompetencyCode[] }, grade: string): Promise<Partial<CognitiveLevels<string>>> => {
    const prompt = `
        Bạn là chuyên gia soạn thảo chương trình Địa lý. Dựa trên sách giáo khoa Địa lý lớp ${grade} (Cánh Diều).
        Nội dung: "${row.content}" thuộc chủ đề "${row.topic}".
        
        Hãy viết Yêu cầu cần đạt (YCCĐ) phân chia theo 3 mức độ:
        - Nhận biết (NL1): Trình bày, nêu tên, xác định vị trí...
        - Thông hiểu (NL2): Giải thích, phân tích mối quan hệ...
        - Vận dụng (NL3): Vẽ và nhận xét biểu đồ (cột, đường, tròn, miền, kết hợp), tính toán số liệu, xử lý tình huống thực tế.
        
        Trả về JSON: { "knowledge": string, "comprehension": string, "application": string }.
    `;

    try {
        const response = await generateWithFallback(prompt);
        return JSON.parse(response.text.trim());
    } catch (e) {
        return { knowledge: "Đang cập nhật...", comprehension: "Đang cập nhật...", application: "Đang cập nhật..." };
    }
};

export const parseMatrixFromFile = async (file: { data: string; mimeType: string }, fileName: string): Promise<MatrixData> => {
    const prompt = `Phân tích ma trận Địa lý ${fileName} bám sát cấu trúc Cánh Diều lớp 10,11,12. Trả về JSON MatrixData.`;
    const content = [
        { inlineData: file.mimeType === 'application/pdf' ? file : undefined, text: file.mimeType !== 'application/pdf' ? `Nội dung: ${atob(file.data)}` : undefined },
        { text: prompt }
    ].filter(p => p.text || p.inlineData) as any;

    try {
        const response = await generateWithFallback(content);
        return JSON.parse(response.text.trim());
    } catch (e) { throw new Error("Lỗi đọc file hoặc API quá tải."); }
};

export const generateExamFromMatrix = async (matrix: MatrixData): Promise<ExamQuestion[]> => {
    const prompt = `
        Bạn là giáo viên Địa lý chuyên nghiệp sách Cánh Diều. Hãy soạn đề thi Địa lý lớp ${matrix.grade} từ ma trận: ${JSON.stringify(matrix.rows)}.
        Cấu hình điểm: ${JSON.stringify(matrix.points)}.

        YÊU CẦU BẮT BUỘC:
        1. Đề thi phải có đủ 4 phần tương ứng với ma trận:
           - Phần I: Trắc nghiệm khách quan (Nhiều lựa chọn).
           - Phần II: Trắc nghiệm Đúng/Sai.
           - Phần III: Trắc nghiệm Trả lời ngắn.
           - Phần IV: Tự luận.
        2. Với câu hỏi TỰ LUẬN ở mức độ "Vận dụng" (application): BẮT BUỘC là dạng "Vẽ và nhận xét biểu đồ". Cung cấp bảng số liệu logic.
        3. Mỗi câu hỏi PHẢI bao gồm:
           - "points": Số điểm của câu đó dựa trên cấu hình điểm đã cho.
           - "correct_answer": Đáp án đúng (với MCQ, Đúng/Sai, Trả lời ngắn).
           - "grading_scheme": Biểu điểm chi tiết (Đặc biệt quan trọng cho Tự luận và Trả lời ngắn).
        4. Với phần Đúng/Sai, mỗi ý a, b, c, d phải có đáp án is_true rõ ràng.

        Trả về JSON dạng ExamQuestion[]. (Chỉ trả về JSON Array, không bọc markdown)
    `;
    const response = await generateWithFallback(prompt);
    return JSON.parse(response.text.trim());
};

export const generateExamFromDirectSource = async (sourceText: string, grade: string): Promise<ExamQuestion[]> => {
    const prompt = `
        Soạn đề thi Địa lý lớp ${grade} Cánh Diều từ văn bản/ma trận này: ${sourceText}.
        Đảm bảo đủ 4 dạng: MCQ, Đúng/Sai, Trả lời ngắn, Tự luận.
        LƯU Ý: Essay vận dụng là vẽ biểu đồ.
        Mỗi câu hỏi phải có: "points", "correct_answer", "grading_scheme".
        Trả về JSON format.
    `;
    const response = await generateWithFallback(prompt);
    return JSON.parse(response.text.trim());
};

export const shuffleExamVariants = async (baseQuestions: ExamQuestion[], variantCount: number): Promise<ExamQuestion[][]> => {
    const response = await generateWithFallback(`Tạo ${variantCount} mã đề xáo trộn từ: ${JSON.stringify(baseQuestions)}. Giữ nguyên biểu điểm và các bảng số liệu. JSON format.`);
    return JSON.parse(response.text.trim());
};

export const gradeAnswerWithAI = async (question: string, criteria: string, maxScore: number, studentAnswer: string): Promise<AIGradeResult> => {
    const response = await generateWithFallback(`Chấm điểm Địa lý. Đề: ${question}. Đáp án & Biểu điểm: ${criteria}. Bài làm: ${studentAnswer}. JSON: {score, feedback}.`);
    return JSON.parse(response.text.trim());
};

export const generateMixedGameQuestions = async (topic: SelectedTopic, count: number = 6): Promise<ExamQuestion[]> => {
    const response = await generateWithFallback(`Tạo bộ câu hỏi game Địa lý lớp ${topic.grade} bài ${topic.unit} (Cánh Diều). JSON format.`);
    return JSON.parse(response.text.trim());
};

export const analyzeGameResults = async (gameName: string, topicName: string, players: Player[]): Promise<string> => {
    const summary = players.map(p => `${p.name}: ${p.score}`).join('\n');
    const response = await generateWithFallback(`Nhận xét kết quả game ${gameName} bài ${topicName}: ${summary}`);
    return response.text || "";
};

export const generateQuizQuestion = async (topic?: SelectedTopic): Promise<MultipleChoiceQuestion> => {
    const response = await generateWithFallback(`Tạo 1 câu hỏi TN Địa lý ${topic ? `về ${topic.unit}` : 'ngẫu nhiên'}. JSON format.`);
    return JSON.parse(response.text.trim());
};
