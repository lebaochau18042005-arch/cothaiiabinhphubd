
import React, { useMemo, forwardRef } from 'react';
import type { MatrixData, CognitiveLevels, CognitiveLevel, QuestionFormat, CompetencyCode } from '../types';

interface SpecificationTableProps {
  matrixData: MatrixData;
  learningOutcomes: Record<string, Partial<CognitiveLevels<string>>>;
  onUpdateOutcome?: (key: string, level: CognitiveLevel, newText: string) => void;
  onUpdateCount?: (topic: string, content: string, format: QuestionFormat, level: CognitiveLevel, newCount: number) => void;
}

const levelKeys: CognitiveLevel[] = ['knowledge', 'comprehension', 'application'];
const questionFormatKeys: QuestionFormat[] = ['multiple_choice', 'true_false', 'short_answer', 'essay'];

const levelLabels: Record<CognitiveLevel, string> = {
    knowledge: 'Nhận biết',
    comprehension: 'Thông hiểu',
    application: 'Vận dụng',
};

const getCompetencyForCell = (format: QuestionFormat, level: CognitiveLevel, rowCodes: CompetencyCode[]): string => {
    if (format === 'short_answer') return '(NL3)';
    if (format === 'essay' && level === 'application') return '(NL3)';
    if (level === 'knowledge') return '(NL1)';
    if (level === 'comprehension') return '(NL2)';
    return (rowCodes || []).length > 0 ? `(${rowCodes[0]})` : '';
};

const SpecificationTable = forwardRef<HTMLDivElement, SpecificationTableProps>(({ 
    matrixData, 
    learningOutcomes, 
    onUpdateOutcome,
    onUpdateCount 
}, ref) => {
    const rows = Array.isArray(matrixData?.rows) ? matrixData.rows : [];

    const aggregatedData = useMemo(() => {
        const contentMap = new Map<string, {
            topic: string;
            content: string;
            learningOutcomes: Partial<CognitiveLevels<string>>;
            questionCounts: CognitiveLevels<Record<QuestionFormat, number>>;
            competencyCodes: CompetencyCode[];
            hasQuestionsAtLevel: CognitiveLevels<boolean>;
        }>();

        rows.forEach(row => {
            const key = `${row.topic}|${row.content}`;
            if (!contentMap.has(key)) {
                contentMap.set(key, {
                    topic: row.topic,
                    content: row.content,
                    learningOutcomes: (learningOutcomes && learningOutcomes[key]) || {},
                    questionCounts: {
                        knowledge: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
                        comprehension: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
                        application: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
                    },
                    competencyCodes: row.competencyCodes || [],
                    hasQuestionsAtLevel: { knowledge: false, comprehension: false, application: false }
                });
            }
            const current = contentMap.get(key)!;
            levelKeys.forEach(level => {
                let levelCount = 0;
                questionFormatKeys.forEach(format => {
                    const count = row.levels?.[level]?.[format] || 0;
                    current.questionCounts[level][format] += count;
                    levelCount += count;
                });
                if (levelCount > 0) current.hasQuestionsAtLevel[level] = true;
            });
        });
        return Array.from(contentMap.values());
    }, [rows, learningOutcomes]);

    if (aggregatedData.length === 0) return <div className="text-center py-10 bg-gray-50 rounded-xl">Chưa có dữ liệu ma trận để hiển thị bản đặc tả.</div>;

    return (
        <div ref={ref} className="overflow-x-auto bg-white">
            <style>{`
                .spec-table th, .spec-table td { font-family: 'Times New Roman', Times, serif; }
                .spec-table textarea { font-family: 'Times New Roman', Times, serif; }
                .spec-table input { font-family: 'Times New Roman', Times, serif; }
            `}</style>
            <table className="min-w-full border-collapse border border-black text-[10.5pt] spec-table shadow-sm">
                <thead className="bg-gray-100 font-bold text-center">
                    <tr>
                        <th rowSpan={3} className="border border-black p-2 bg-gray-200">TT</th>
                        <th rowSpan={3} className="border border-black p-2 w-1/5 bg-gray-200">Nội dung kiến thức</th>
                        <th rowSpan={3} className="border border-black p-2 w-2/5 bg-gray-200">Yêu cầu cần đạt</th>
                        <th colSpan={12} className="border border-black p-1 bg-gray-200">Số câu hỏi ở mức độ nhận thức</th>
                    </tr>
                    <tr>
                        <th colSpan={3} className="border border-black p-1">Nhiều lựa chọn</th>
                        <th colSpan={3} className="border border-black p-1">Đúng - Sai</th>
                        <th colSpan={3} className="border border-black p-1">Trả lời ngắn</th>
                        <th colSpan={3} className="border border-black p-1">Tự luận</th>
                    </tr>
                    <tr className="bg-gray-50">
                        {Array(4).fill(0).map((_, i) => (
                            levelKeys.map(l => (
                                <th key={`${i}-${l}`} className="border border-black p-1 font-semibold text-[9pt]">
                                    {l === 'knowledge' ? 'NB' : l === 'comprehension' ? 'TH' : 'VD'}
                                </th>
                            ))
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {aggregatedData.map((item, idx) => {
                        const activeLevels = levelKeys.filter(l => item.hasQuestionsAtLevel[l]);
                        const levelsToRender = activeLevels.length > 0 ? activeLevels : ['knowledge' as CognitiveLevel];

                        return levelsToRender.map((level, lIdx) => (
                            <tr key={`${idx}-${level}`} className="hover:bg-blue-50/30 transition-colors">
                                {lIdx === 0 && (
                                    <>
                                        <td rowSpan={levelsToRender.length} className="border border-black p-2 text-center font-bold align-top">{idx + 1}</td>
                                        <td rowSpan={levelsToRender.length} className="border border-black p-2 font-bold align-top bg-stone-50">{item.content}</td>
                                    </>
                                )}
                                <td className="border border-black p-2 text-left align-top">
                                    <div className="flex items-baseline space-x-2 mb-1">
                                        <span className="font-bold underline text-indigo-900 whitespace-nowrap">{levelLabels[level]}:</span>
                                    </div>
                                    <textarea
                                        defaultValue={item.learningOutcomes?.[level] || ''}
                                        onBlur={(e) => onUpdateOutcome && onUpdateOutcome(`${item.topic}|${item.content}`, level, e.target.value)}
                                        className="w-full text-[10pt] border-none focus:ring-1 focus:ring-indigo-200 rounded p-1.5 min-h-[80px] bg-transparent resize-y"
                                        placeholder="Nhập yêu cầu cần đạt..."
                                    />
                                </td>
                                {questionFormatKeys.map(format => levelKeys.map(cellL => {
                                    const count = item.questionCounts?.[cellL]?.[format] || 0;
                                    const isMatch = cellL === level;
                                    const competency = getCompetencyForCell(format, cellL, item.competencyCodes);
                                    
                                    return (
                                        <td key={`${format}-${cellL}`} className={`border border-black p-1 text-center align-middle ${!isMatch ? 'bg-gray-100/30 opacity-20' : ''}`}>
                                            {isMatch ? (
                                                <div className="flex flex-col items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        defaultValue={count || ''}
                                                        onBlur={(e) => onUpdateCount && onUpdateCount(item.topic, item.content, format, cellL, parseInt(e.target.value) || 0)}
                                                        className="w-10 text-center font-bold text-gray-900 border-none bg-transparent p-0 focus:ring-1 focus:ring-indigo-200 rounded"
                                                    />
                                                    {count > 0 && <span className="text-[7.5pt] text-indigo-600 font-bold mt-0.5">{competency}</span>}
                                                </div>
                                            ) : ''}
                                        </td>
                                    );
                                }))}
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
        </div>
    );
});

export default SpecificationTable;