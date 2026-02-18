
import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import mammoth from 'mammoth';
import SpecificationTable from '../components/SpecificationTable';
import PointSettingsModal from '../components/PointSettingsModal';
import AddContentModal from '../components/AddContentModal';
import SaveMatrixModal from '../components/SaveMatrixModal';
import UploadIcon from '../components/icons/UploadIcon';
import CompetencyInfo from '../components/CompetencyInfo';
import { generateLearningOutcomesForRow, generateExamFromMatrix, parseMatrixFromFile } from '../services/geminiService';
import { storageService } from '../services/storageService';
import type { MatrixRow, MatrixData, PointSettings, CognitiveLevel, QuestionFormat, CognitiveLevels, QuestionTypeCounts, SavedMatrix, CompetencyCode, ExamQuestion } from '../types';

// START: Helper components and functions for export
interface PrintableLayoutProps {
    title: string;
    subTitle?: string;
    meta: Array<{ label: string; value: string | number }>;
    children: React.ReactNode;
    footerText?: string;
}

const PrintableLayout: React.FC<PrintableLayoutProps> = ({ title, subTitle, meta, children, footerText }) => {
    return (
        <div className="printable-content bg-white text-black p-8" style={{ width: '297mm', minHeight: '210mm', fontFamily: "'Times New Roman', Times, serif" }}>
            <style>{`
        .printable-content { font-size: 12pt; }
        .printable-content table { border-collapse: collapse; width: 100%; }
        .printable-content th, .printable-content td { border: 1px solid black; padding: 5px; text-align: center; vertical-align: middle; }
        .printable-content th { font-weight: bold; background-color: #f2f2f2; color: black !important; }
        .printable-content .text-left { text-align: left; }
        .printable-content .font-normal { font-weight: normal; }
       `}</style>
            <header className="text-center text-sm font-semibold mb-4" style={{ fontSize: '13pt' }}>
                <p className="uppercase">SỞ GIÁO DỤC VÀ ĐÀO TẠO...</p>
                <p className="uppercase font-bold underline">TRƯỜNG THPT...</p>
            </header>

            <main className="mt-8">
                <h1 className="text-center text-base font-bold uppercase" style={{ fontSize: '14pt' }}>{title}</h1>
                {subTitle && <h2 className="text-center text-base font-bold whitespace-pre-wrap">{subTitle}</h2>}

                <div className="flex justify-center my-4">
                    <table className="text-sm border-none">
                        <tbody className="text-left">
                            {(meta || []).map(item => (
                                <tr key={item.label}>
                                    <td className="pr-4 font-semibold border-none">{item.label}:</td>
                                    <td className="border-none">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="content-body text-sm">
                    {children}
                </div>
            </main>

            {footerText && (
                <footer className="mt-8">
                    <div className="flex justify-end">
                        <div className="text-center text-sm w-1/3">
                            <p><em>Ngày... tháng... năm...</em></p>
                            <p className="font-semibold">Người ra đề</p>
                            <br /><br /><br />
                            <p className="font-semibold">{footerText}</p>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

const renderComponentToElement = async (component: React.ReactElement): Promise<HTMLElement> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    await new Promise<void>(resolve => {
        const root = ReactDOM.createRoot(container);
        root.render(<React.StrictMode>{component}</React.StrictMode>);
        setTimeout(() => resolve(), 500);
    });

    return container;
};

const cleanupContainer = (container: HTMLElement) => {
    if (container) {
        document.body.removeChild(container);
    }
};

const exportComponentToPdf = async (component: React.ReactElement, filename: string, orientation: 'p' | 'l' = 'l') => {
    let container: HTMLElement | null = null;
    try {
        container = await renderComponentToElement(component);
        const element = container.firstElementChild as HTMLElement;
        const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF(orientation, 'mm', 'a4');
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save(`${filename}.pdf`);
    } catch (err) { console.error("PDF Export Error:", err); }
    finally { if (container) cleanupContainer(container); }
};

const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportComponentToDocx = async (component: React.ReactElement, filename: string) => {
    let container: HTMLElement | null = null;
    try {
        container = await renderComponentToElement(component);
        const element = container.firstElementChild as HTMLElement;
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>body{font-family:'Times New Roman', Times, serif; font-size: 12pt;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid black;padding:4px; text-align: center; vertical-align: middle;} th{font-weight: bold; background-color: #f2f2f2;} .text-left{text-align: left;} .font-normal{font-weight: normal;}</style></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + element.innerHTML + footer;
        triggerDownload(sourceHTML, `${filename}.docx`, 'application/vnd.ms-word');
    } catch (err) { console.error("DOCX Export Error:", err); }
    finally { if (container) cleanupContainer(container); }
};

const cognitiveLevelKeys: CognitiveLevel[] = ['knowledge', 'comprehension', 'application'];
const questionFormatKeys: QuestionFormat[] = ['multiple_choice', 'true_false', 'short_answer', 'essay'];
const levelNames: Record<CognitiveLevel, string> = {
    knowledge: "Nhận biết",
    comprehension: "Thông hiểu",
    application: "Vận dụng",
};
const shortLevelNames: Record<CognitiveLevel, string> = {
    knowledge: "Biết",
    comprehension: "Hiểu",
    application: "Vận dụng",
};
const questionTypeGroups = {
    tnkq: ['multiple_choice', 'true_false', 'short_answer'] as QuestionFormat[],
    tu_luan: ['essay'] as QuestionFormat[]
};
const questionFormatNames: Record<QuestionFormat, string> = {
    multiple_choice: "Nhiều lựa chọn",
    true_false: "Đúng - Sai",
    short_answer: "Trả lời ngắn",
    essay: "Tự luận",
};

// Printable Matrix Component matching CV 7991
const PrintableMatrix: React.FC<{ matrixData: MatrixData, totals: any }> = ({ matrixData, totals }) => {
    const rows = matrixData?.rows || [];

    return (
        <table className="min-w-full text-xs">
            <thead>
                <tr>
                    <th rowSpan={4}>TT</th>
                    <th rowSpan={4} className="text-left">Nội dung/đơn vị kiến thức</th>
                    <th colSpan={questionFormatKeys.length * cognitiveLevelKeys.length}>Mức độ đánh giá</th>
                    <th colSpan={cognitiveLevelKeys.length}>Tổng</th>
                    <th rowSpan={4}>Tỉ lệ % điểm</th>
                </tr>
                <tr>
                    <th colSpan={questionTypeGroups.tnkq.length * cognitiveLevelKeys.length} className="font-normal">TNKQ</th>
                    <th colSpan={questionTypeGroups.tu_luan.length * cognitiveLevelKeys.length} className="font-normal">Tự luận</th>
                    {cognitiveLevelKeys.map(level => <th key={`total-${level}`} rowSpan={3} className="font-normal">{levelNames[level]}</th>)}
                </tr>
                <tr>
                    {questionTypeGroups.tnkq.map(format => <th key={format} colSpan={cognitiveLevelKeys.length} className="font-normal">{questionFormatNames[format]}</th>)}
                    {questionTypeGroups.tu_luan.map(format => <th key={format} colSpan={cognitiveLevelKeys.length} className="font-normal">{questionFormatNames[format]}</th>)}
                </tr>
                <tr>
                    {questionFormatKeys.map(format =>
                        cognitiveLevelKeys.map(level => <th key={`${format}-${level}`} className="font-normal">{shortLevelNames[level]}</th>)
                    )}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => {
                    const rowTotalPoints = totals.rowLevelTotals?.get(row.id)
                        ? cognitiveLevelKeys.reduce((acc, level) => acc + (totals.rowLevelTotals.get(row.id)![level]?.points || 0), 0)
                        : 0;
                    const percentage = totals.grandTotal?.points > 0
                        ? (rowTotalPoints / totals.grandTotal.points) * 100
                        : 0;

                    return (
                        <tr key={row.id}>
                            <td>{index + 1}</td>
                            <td className="text-left"><strong>{row.topic}</strong><br /><span className="font-normal">{row.content}</span></td>
                            {questionFormatKeys.map(format =>
                                cognitiveLevelKeys.map(level =>
                                    <td key={`${row.id}-${format}-${level}`}>{row.levels?.[level]?.[format] || ''}</td>
                                )
                            )}
                            {cognitiveLevelKeys.map(level => (
                                <td key={`total-row-${row.id}-${level}`} className="font-bold">{totals.rowLevelTotals.get(row.id)?.[level]?.count || ''}</td>
                            ))}
                            <td className="font-bold">{percentage > 0 ? percentage.toFixed(0) : ''}</td>
                        </tr>
                    )
                })}
            </tbody>
            <tfoot className="font-bold">
                <tr>
                    <td colSpan={2} className="text-left">Tổng số câu</td>
                    {questionFormatKeys.map(format =>
                        cognitiveLevelKeys.map(level =>
                            <td key={`total-count-${format}-${level}`}>{totals.columnTotals?.count?.[format]?.[level] || ''}</td>
                        )
                    )}
                    {cognitiveLevelKeys.map(level =>
                        <td key={`grand-total-count-${level}`}>{totals.levelTotals?.count?.[level] || 0}</td>
                    )}
                    <td></td>
                </tr>
                <tr>
                    <td colSpan={2} className="text-left">Tổng số điểm</td>
                    {questionFormatKeys.map(format =>
                        cognitiveLevelKeys.map(level =>
                            <td key={`total-points-${format}-${level}`}>{(totals.columnTotals?.points?.[format]?.[level] || 0).toFixed(2)}</td>
                        )
                    )}
                    {cognitiveLevelKeys.map(level =>
                        <td key={`grand-total-points-${level}`}>{(totals.levelTotals?.points?.[level] || 0).toFixed(2)}</td>
                    )}
                    <td></td>
                </tr>
                <tr>
                    <td colSpan={2} className="text-left">Tỉ lệ %</td>
                    {questionFormatKeys.map(format =>
                        cognitiveLevelKeys.map(level =>
                            <td key={`total-percent-${format}-${level}`}>
                                {totals.grandTotal?.points > 0 ? (((totals.columnTotals?.points?.[format]?.[level] ?? 0) / totals.grandTotal.points) * 100).toFixed(0) : 0}%
                            </td>
                        )
                    )}
                    {cognitiveLevelKeys.map(level =>
                        <td key={`grand-total-percent-${level}`}>
                            {totals.grandTotal?.points > 0 ? (((totals.levelTotals?.points?.[level] || 0) / totals.grandTotal.points) * 100).toFixed(0) : 0}%
                        </td>
                    )}
                    <td></td>
                </tr>
            </tfoot>
        </table>
    )
};


interface ExamMatrixCreatorProps {
    onMatrixCreated: (data: MatrixData) => void;
    onExamQuickGenerated: (questions: ExamQuestion[], matrix: MatrixData) => void;
}

const emptyRow: MatrixRow = {
    id: '',
    topic: '',
    content: '',
    competencyCodes: [],
    levels: {
        knowledge: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
        comprehension: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
        application: { multiple_choice: 0, true_false: 0, short_answer: 0, essay: 0 },
    },
};

const createEmptyRow = (): MatrixRow => ({
    ...emptyRow,
    id: crypto.randomUUID(),
    levels: JSON.parse(JSON.stringify(emptyRow.levels)) // Deep copy
});

const defaultPoints: PointSettings = {
    multiple_choice: { knowledge: 0.25, comprehension: 0.25, application: 0.25 },
    true_false: { knowledge: 0.25, comprehension: 0.25, application: 0.25 },
    short_answer: { knowledge: 0.25, comprehension: 0.25, application: 0.25 },
    essay: { knowledge: 0.5, comprehension: 1.0, application: 2.0 },
};

type View = 'matrix' | 'specification';

const ExportDropdown: React.FC<{ onExport: (format: 'pdf' | 'csv' | 'docx') => void; isExporting: boolean; }> = ({ onExport, isExporting }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleSelect = (format: 'pdf' | 'csv' | 'docx') => { onExport(format); setIsOpen(false); };
    return (
        <div ref={dropdownRef} className="relative inline-block text-left">
            <button onClick={() => setIsOpen(!isOpen)} disabled={isExporting} className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed">
                {isExporting ? 'Đang xuất...' : 'Tải xuống'}
                <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleSelect('pdf'); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Xuất PDF</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleSelect('csv'); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Xuất Excel (CSV)</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleSelect('docx'); }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100">Xuất Word (.docx)</a>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExamMatrixCreator: React.FC<ExamMatrixCreatorProps> = ({ onMatrixCreated, onExamQuickGenerated }) => {
    const [matrixName, setMatrixName] = useState('');
    const [creatorName, setCreatorName] = useState('Cô Thái');
    const [subject, setSubject] = useState('Địa Lý');
    const [grade, setGrade] = useState<'10' | '11' | '12'>('11');
    const [rows, setRows] = useState<MatrixRow[]>([createEmptyRow()]);
    const [pointSettings, setPointSettings] = useState<PointSettings>(defaultPoints);
    const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
    const [view, setView] = useState<View>('matrix');
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [savedMatrices, setSavedMatrices] = useState<SavedMatrix[]>([]);
    const [learningOutcomes, setLearningOutcomes] = useState<Record<string, Partial<CognitiveLevels<string>>>>({});
    const [isLoadingOutcomes, setIsLoadingOutcomes] = useState(false);
    const [isGeneratingExam, setIsGeneratingExam] = useState(false);
    const [isImportingFile, setIsImportingFile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter for Saved Matrices Gallery
    const [searchSaved, setSearchSaved] = useState('');
    const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11' | '12'>('all');

    useEffect(() => {
        try {
            const storedMatrices = storageService.getMatrices();
            setSavedMatrices(storedMatrices);
        } catch (e) { console.error("Failed to parse saved matrices", e); setSavedMatrices([]); }
    }, []);

    const resetForm = () => {
        setMatrixName('');
        setCreatorName('Cô Thái');
        setSubject('Địa Lý');
        setGrade('11');
        setRows([createEmptyRow()]);
        setPointSettings(defaultPoints);
        setLearningOutcomes({});
        setError(null);
    };

    const addRow = () => setRows([...rows, createEmptyRow()]);
    const removeRow = (rowId: string) => setRows(rows.filter(row => row.id !== rowId));
    const handleRowChange = <K extends keyof MatrixRow>(rowId: string, field: K, value: MatrixRow[K]) => {
        setRows(rows.map(row => (row.id === rowId ? { ...row, [field]: value } : row)));
    };
    const handleQuestionCountChange = (rowId: string, level: CognitiveLevel, format: QuestionFormat, value: number) => {
        setRows(rows.map(row => {
            if (row.id === rowId) {
                const newLevels = { ...row.levels };
                newLevels[level] = { ...newLevels[level], [format]: Math.max(0, value) };
                return { ...row, levels: newLevels };
            }
            return row;
        }));
    };

    const handleUpdateOutcome = (key: string, level: CognitiveLevel, newText: string) => {
        setLearningOutcomes(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [level]: newText
            }
        }));
    };

    const handleUpdateCountInSpec = (topic: string, content: string, format: QuestionFormat, level: CognitiveLevel, newCount: number) => {
        setRows(prevRows => {
            const matchingRowIdx = prevRows.findIndex(r => r.topic === topic && r.content === content);
            if (matchingRowIdx > -1) {
                const updatedRows = [...prevRows];
                const updatedRow = { ...updatedRows[matchingRowIdx] };
                updatedRow.levels = { ...updatedRow.levels };
                updatedRow.levels[level] = { ...updatedRow.levels[level], [format]: Math.max(0, newCount) };
                updatedRows[matchingRowIdx] = updatedRow;
                return updatedRows;
            }
            return prevRows;
        });
    };

    const handleAddContentFromModal = (data: { topic: string; content: string; format: QuestionFormat; level: CognitiveLevel; competencyCodes: CompetencyCode[]; count: number; }) => {
        const { topic, content, format, level, competencyCodes, count } = data;
        const existingRow = rows.find(r => r.topic === topic && r.content === content);

        if (existingRow) {
            setRows(rows.map(r => {
                if (r.id === existingRow.id) {
                    const newLevels = { ...r.levels };
                    newLevels[level][format] = (newLevels[level][format] || 0) + count;
                    const newCompetencyCodes = Array.from(new Set([...r.competencyCodes, ...competencyCodes]));
                    return { ...r, levels: newLevels, competencyCodes: newCompetencyCodes };
                }
                return r;
            }));
        } else {
            const newRow = createEmptyRow();
            newRow.topic = topic;
            newRow.content = content;
            newRow.levels[level][format] = count;
            newRow.competencyCodes = competencyCodes;

            const firstRowIsEmpty = rows.length === 1 && !rows[0].topic && !rows[0].content && (totals.grandTotal?.count || 0) === 0;
            if (firstRowIsEmpty) setRows([newRow]);
            else setRows([...rows, newRow]);
        }
        setIsAddContentModalOpen(false);
    };

    const totals = useMemo(() => {
        const rowLevelTotals = new Map<string, CognitiveLevels<{ count: number; points: number }>>();
        const levelTotals: { count: CognitiveLevels, points: CognitiveLevels } = {
            count: { knowledge: 0, comprehension: 0, application: 0 },
            points: { knowledge: 0, comprehension: 0, application: 0 }
        };

        (rows || []).forEach(row => {
            const levelData: CognitiveLevels<{ count: number; points: number }> = {
                knowledge: { count: 0, points: 0 }, comprehension: { count: 0, points: 0 },
                application: { count: 0, points: 0 }
            };
            cognitiveLevelKeys.forEach(level => {
                let levelCount = 0;
                let levelPoints = 0;
                questionFormatKeys.forEach(format => {
                    const count = row.levels?.[level]?.[format] || 0;
                    const pointValue = pointSettings?.[format]?.[level] ?? 0;
                    levelCount += count;
                    levelPoints += count * pointValue;
                });
                levelData[level] = { count: levelCount, points: levelPoints };
                levelTotals.count[level] += levelCount;
                levelTotals.points[level] += levelPoints;
            });
            rowLevelTotals.set(row.id, levelData);
        });

        const grandTotal = {
            count: Object.values(levelTotals.count).reduce((a, b) => a + b, 0),
            points: Object.values(levelTotals.points).reduce((a, b) => a + b, 0)
        };

        const columnTotals: {
            count: Record<QuestionFormat, CognitiveLevels<number>>,
            points: Record<QuestionFormat, CognitiveLevels<number>>
        } = {
            count: {} as any,
            points: {} as any
        };

        questionFormatKeys.forEach(format => {
            columnTotals.count[format] = { knowledge: 0, comprehension: 0, application: 0 };
            columnTotals.points[format] = { knowledge: 0, comprehension: 0, application: 0 };
            cognitiveLevelKeys.forEach(level => {
                let count = 0;
                (rows || []).forEach(row => {
                    count += row.levels?.[level]?.[format] || 0;
                });
                const pointValue = pointSettings?.[format]?.[level] ?? 0;
                columnTotals.count[format][level] = count;
                columnTotals.points[format][level] = count * pointValue;
            });
        });

        return { rowLevelTotals, levelTotals, grandTotal, columnTotals };
    }, [rows, pointSettings]);

    const getCurrentMatrixData = (): MatrixData => ({ matrixName, creatorName, subject, grade, rows, points: pointSettings });

    const handleSaveMatrix = (name: string) => {
        const newSavedMatrix = storageService.saveMatrix({
            ...getCurrentMatrixData(),
            matrixName: name,
            outcomes: learningOutcomes
        });
        setSavedMatrices(prev => [newSavedMatrix, ...prev]);
        setMatrixName(name);
        setIsSaveModalOpen(false);
    };

    const handleLoadMatrix = (id: string) => {
        const matrixToLoad = savedMatrices.find(m => m.id === id);
        if (matrixToLoad) {
            setMatrixName(matrixToLoad.matrixName || '');
            setCreatorName(matrixToLoad.creatorName || 'Cô Thái');
            setSubject(matrixToLoad.subject || 'Địa Lý');
            setGrade((matrixToLoad.grade as '10' | '11' | '12') || '11');
            setRows(matrixToLoad.rows || [createEmptyRow()]);
            setPointSettings(matrixToLoad.points || defaultPoints);
            if (matrixToLoad.outcomes) setLearningOutcomes(matrixToLoad.outcomes);
            else setLearningOutcomes({});
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDuplicateMatrix = (id: string) => {
        const target = savedMatrices.find(m => m.id === id);
        if (target) {
            const duplicate = storageService.saveMatrix({
                ...target,
                matrixName: `${target.matrixName} (Bản sao)`
            });
            setSavedMatrices(prev => [duplicate, ...prev]);
        }
    };

    const handleDeleteMatrix = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ma trận này không?')) {
            storageService.deleteMatrix(id);
            setSavedMatrices(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleGenerateSpec = async () => {
        setIsLoadingOutcomes(true);
        setError(null);
        try {
            const uniqueContent = new Map<string, { topic: string; content: string; competencyCodes: CompetencyCode[] }>();
            (rows || []).forEach(row => {
                if (row.topic.trim() || row.content.trim()) {
                    const key = `${row.topic}|${row.content}`;
                    if (!uniqueContent.has(key)) {
                        uniqueContent.set(key, { topic: row.topic, content: row.content, competencyCodes: [] });
                    }
                    const current = uniqueContent.get(key)!;
                    current.competencyCodes = Array.from(new Set([...current.competencyCodes, ...(row.competencyCodes || [])]));
                }
            });

            const outcomesToFetch = Array.from(uniqueContent.entries()).filter(([key, _]) => !learningOutcomes[key]);
            if (outcomesToFetch.length > 0) {
                const newOutcomesPromises = outcomesToFetch.map(async ([key, rowData]) => ({ key, outcomes: await generateLearningOutcomesForRow(rowData, grade) }));
                const settledOutcomes = await Promise.all(newOutcomesPromises);
                const newOutcomesMap: Record<string, Partial<CognitiveLevels<string>>> = {};
                settledOutcomes.forEach(item => { newOutcomesMap[item.key] = item.outcomes; });
                setLearningOutcomes(prev => ({ ...prev, ...newOutcomesMap }));
            }
            setView('specification');
        } catch (err: any) {
            console.error("Error generating specs:", err);
            // AI Instruction: Show raw API error
            const errorMessage = err?.message || JSON.stringify(err);
            setError(`Lỗi API: ${errorMessage}`);
        } finally {
            setIsLoadingOutcomes(false);
        }
    };

    const handleGenerateAndNavigate = async () => {
        setIsGeneratingExam(true);
        setError(null);
        try {
            const currentMatrix = getCurrentMatrixData();
            const generatedQuestions = await generateExamFromMatrix(currentMatrix);
            onExamQuickGenerated(generatedQuestions, currentMatrix);
        } catch (err: any) {
            console.error("Error generating exam:", err);
            // AI Instruction: Show raw API error
            const errorMessage = err?.message || JSON.stringify(err);
            setError(`Lỗi API: ${errorMessage}`);
        } finally {
            setIsGeneratingExam(false);
        }
    };

    const escapeCsvCell = (cell: any): string => `"${String(cell ?? '').replace(/"/g, '""')}"`;
    const exportMatrixToCsv = () => {
        let csvContent = '\uFEFF';
        const headers = ['TT', 'Chủ đề/Chương', 'Nội dung/đơn vị kiến thức', 'Mã NL',
            'NB-TN', 'NB-DS', 'NB-TLN', 'NB-ESSAY',
            'TH-TN', 'TH-DS', 'TH-TLN', 'TH-ESSAY',
            'VD-TN', 'VD-DS', 'VD-TLN', 'VD-ESSAY',
        ].map(escapeCsvCell).join(',');
        csvContent += headers + '\r\n';
        (rows || []).forEach((row, index) => {
            let rowData: (string | number)[] = [index + 1, row.topic, row.content, (row.competencyCodes || []).join(';')];
            cognitiveLevelKeys.forEach(level => {
                questionFormatKeys.forEach(format => {
                    rowData.push(row.levels?.[level]?.[format] || 0);
                });
            });
            csvContent += rowData.map(escapeCsvCell).join(',') + '\r\n';
        });
        triggerDownload(csvContent, `${matrixName || 'ma-tran'}.csv`, 'text/csv;charset=utf-8;');
    };

    const handleExport = async (format: 'pdf' | 'csv' | 'docx') => {
        setIsExporting(true);
        const filename = matrixName.trim().replace(/\s+/g, '_') || (view === 'matrix' ? 'ma-tran' : 'ban-dac-ta');
        if (format === 'csv') {
            if (view === 'matrix') exportMatrixToCsv();
            setIsExporting(false); return;
        }
        const mainTitle = view === 'matrix' ? `MA TRẬN ĐỀ KIỂM TRA MÔN ${subject.toUpperCase()} LỚP ${grade}` : `BẢN ĐẶC TẢ ĐỀ KIỂM TRA MÔN ${subject.toUpperCase()} LỚP ${grade}`;
        const componentToExport = (
            <PrintableLayout title={mainTitle} subTitle="NĂM HỌC 2024-2025" meta={[{ label: 'Tên ma trận', value: matrixName || '(Chưa đặt tên)' }]} footerText={creatorName || '...'}>
                {view === 'matrix' ? <PrintableMatrix matrixData={getCurrentMatrixData()} totals={totals} /> : <SpecificationTable matrixData={getCurrentMatrixData()} learningOutcomes={learningOutcomes} onUpdateOutcome={handleUpdateOutcome} onUpdateCount={handleUpdateCountInSpec} />}
            </PrintableLayout>
        );
        try {
            if (format === 'pdf') await exportComponentToPdf(componentToExport, filename, 'l');
            else if (format === 'docx') await exportComponentToDocx(componentToExport, filename);
        } catch (e) { console.error("Export failed", e); }
        finally { setIsExporting(false); }
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError(null);

        const extension = file.name.split('.').pop()?.toLowerCase();
        setIsImportingFile(true);

        try {
            let fileContentBase64 = '';
            let mimeType = file.type;

            if (extension === 'pdf') {
                fileContentBase64 = await blobToBase64(file);
                mimeType = 'application/pdf';
            } else if (extension === 'docx') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                fileContentBase64 = btoa(unescape(encodeURIComponent(result.value)));
                mimeType = 'text/plain';
            } else if (extension === 'html' || extension === 'htm') {
                const text = await file.text();
                fileContentBase64 = btoa(unescape(encodeURIComponent(text)));
                mimeType = 'text/html';
            } else if (extension === 'csv') {
                const text = await file.text();
                fileContentBase64 = btoa(unescape(encodeURIComponent(text)));
                mimeType = 'text/csv';
            } else {
                throw new Error("Định dạng tệp không được hỗ trợ. Vui lòng chọn .csv, .pdf, .docx hoặc .html.");
            }

            const matrixData = await parseMatrixFromFile({ data: fileContentBase64, mimeType }, file.name);

            if (matrixData.matrixName) setMatrixName(matrixData.matrixName);
            if (matrixData.rows) setRows(matrixData.rows);
            if (matrixData.grade) setGrade(matrixData.grade as any);
            if (matrixData.subject) setSubject(matrixData.subject);

        } catch (err: any) {
            console.error("Error supporting file:", err);
            // AI Instruction: Show raw API error
            const errorMessage = err?.message || JSON.stringify(err);
            setError(`Lỗi API: ${errorMessage}`);
        } finally {
            setIsImportingFile(false);
        }

        if (event.target) event.target.value = '';
    };

    const filteredMatrices = useMemo(() => {
        return (savedMatrices || []).filter(m => {
            const matchesSearch = (m.matrixName || '').toLowerCase().includes(searchSaved.toLowerCase());
            const matchesGrade = filterGrade === 'all' || m.grade === filterGrade;
            return matchesSearch && matchesGrade;
        }).sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
    }, [savedMatrices, searchSaved, filterGrade]);


    if (view === 'specification') {
        return (
            <div className="card p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <button onClick={() => setView('matrix')} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">← Quay lại Ma trận</button>
                    <div className="flex items-center gap-4">
                        <ExportDropdown onExport={handleExport} isExporting={isExporting} />
                        <button
                            onClick={handleGenerateAndNavigate}
                            disabled={isGeneratingExam}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            {isGeneratingExam ? (
                                <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang soạn...</>
                            ) : 'Tạo Đề Thi với AI →'}
                        </button>
                    </div>
                </div>
                <SpecificationTable
                    matrixData={getCurrentMatrixData()}
                    learningOutcomes={learningOutcomes}
                    onUpdateOutcome={handleUpdateOutcome}
                    onUpdateCount={handleUpdateCountInSpec}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AddContentModal isOpen={isAddContentModalOpen} onClose={() => setIsAddContentModalOpen(false)} onAdd={handleAddContentFromModal} currentPointSettings={pointSettings} grade={grade} />
            <PointSettingsModal isOpen={isPointModalOpen} onClose={() => setIsPointModalOpen(false)} initialSettings={pointSettings} onSave={setPointSettings} />
            <SaveMatrixModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSave={handleSaveMatrix} defaultName={matrixName || `Ma trận Lớp ${grade}`} />

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p className="font-mono">{error}</p>
                            </div>
                        </div>
                        <div className="ml-auto pl-3">
                            <div className="-mx-1.5 -my-1.5">
                                <button
                                    onClick={() => setError(null)}
                                    type="button"
                                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card p-6 md:p-8 bg-gradient-to-r from-indigo-50 to-white border-indigo-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Cấu hình Ma trận mới</h2>
                        <p className="text-gray-500 text-sm mb-4">Thiết lập các thông số cơ bản cho kỳ thi.</p>
                    </div>
                    <button onClick={resetForm} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                        Bắt đầu mới
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700">Tên ma trận</label><input type="text" value={matrixName} onChange={e => setMatrixName(e.target.value)} placeholder="Nhập tên ma trận..." className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Người tạo</label><input type="text" value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="Nhập tên người tạo..." className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Môn học</label><select value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500"><option>Địa Lý</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700">Lớp</label><select value={grade} onChange={e => setGrade(e.target.value as '10' | '11' | '12')} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500"><option value="10">10</option><option value="11">11</option><option value="12">12</option></select></div>
                </div>
            </div>

            <div className="card p-6 md:p-8">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div><h2 className="text-2xl font-bold text-gray-800">Xây dựng ma trận (Theo CV 7991)</h2><CompetencyInfo /></div>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setIsPointModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">Cài đặt thang điểm</button>
                        <button onClick={() => setIsAddContentModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>Thêm Yêu cầu
                        </button>
                    </div>
                </div>

                {isImportingFile && (
                    <div className="flex items-center justify-center py-4 bg-indigo-50 border border-indigo-100 rounded-lg mb-4 animate-pulse">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>
                        <p className="text-indigo-700 font-medium">AI đang trích xuất dữ liệu ma trận từ tệp... Vui lòng đợi...</p>
                    </div>
                )}

                <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-inner">
                    <table className="min-w-full text-xs text-center border-collapse">
                        <thead className="bg-indigo-700 text-white font-semibold align-middle">
                            <tr>
                                <th rowSpan={4} className="p-1 border border-indigo-300">TT</th>
                                <th rowSpan={4} className="p-1 border border-indigo-300 min-w-[250px]">Nội dung/đơn vị kiến thức</th>
                                <th colSpan={questionFormatKeys.length * cognitiveLevelKeys.length} className="p-1 border border-indigo-300">Mức độ đánh giá</th>
                                <th colSpan={cognitiveLevelKeys.length} className="p-1 border border-indigo-300">Tổng</th>
                                <th rowSpan={4} className="p-1 border border-indigo-300">Tỉ lệ % điểm</th>
                            </tr>
                            <tr>
                                <th colSpan={questionTypeGroups.tnkq.length * cognitiveLevelKeys.length} className="p-1 border border-indigo-300 font-normal">TNKQ</th>
                                <th colSpan={questionTypeGroups.tu_luan.length * cognitiveLevelKeys.length} className="p-1 border border-indigo-300 font-normal">Tự luận</th>
                                {cognitiveLevelKeys.map(level => <th key={`total-level-${level}`} rowSpan={3} className="p-1 border border-indigo-300 font-normal">{levelNames[level]}</th>)}
                            </tr>
                            <tr>
                                {questionTypeGroups.tnkq.map(format => <th key={format} colSpan={cognitiveLevelKeys.length} className="p-1 border border-indigo-300 font-normal">{questionFormatNames[format]}</th>)}
                                {questionTypeGroups.tu_luan.map(format => <th key={format} colSpan={cognitiveLevelKeys.length} className="p-1 border border-indigo-300 font-normal">{questionFormatNames[format]}</th>)}
                            </tr>
                            <tr>
                                {questionFormatKeys.map(format =>
                                    cognitiveLevelKeys.map(level => <th key={`${format}-${level}`} className="p-1 border border-indigo-300 font-normal">{shortLevelNames[level]}</th>)
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {(rows || []).map((row, index) => {
                                const rowTotalsData = totals.rowLevelTotals.get(row.id);
                                const rowTotalPoints = rowTotalsData
                                    ? cognitiveLevelKeys.reduce((acc, level) => acc + (rowTotalsData[level]?.points || 0), 0)
                                    : 0;

                                const percentage = totals.grandTotal?.points > 0
                                    ? (rowTotalPoints / totals.grandTotal.points) * 100
                                    : 0;

                                return (
                                    <tr key={row.id} className="hover:bg-indigo-50/30 group transition-colors">
                                        <td className="p-2 border border-gray-200 align-middle font-medium text-gray-500">{index + 1}</td>
                                        <td className="p-1 border border-gray-200">
                                            <textarea value={row.topic} onChange={e => handleRowChange(row.id, 'topic', e.target.value)} className="w-full border-gray-200 rounded-md text-sm p-1.5 resize-y focus:ring-1 focus:ring-indigo-300" placeholder="Chủ đề..." />
                                            <textarea value={row.content} onChange={e => handleRowChange(row.id, 'content', e.target.value)} className="w-full border-gray-200 rounded-md text-sm p-1.5 resize-y mt-1.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-300" placeholder="Nội dung..." />
                                        </td>
                                        {questionFormatKeys.map(format =>
                                            cognitiveLevelKeys.map(level =>
                                                <td key={`${level}-${format}`} className="p-1 border border-gray-200 align-middle">
                                                    <input type="number" min="0" placeholder={shortLevelNames[level]} value={row.levels?.[level]?.[format] || ''} onChange={e => handleQuestionCountChange(row.id, level, format, parseInt(e.target.value))} className="w-14 text-center border-gray-200 rounded-md p-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                                                </td>
                                            )
                                        )}
                                        {cognitiveLevelKeys.map(level => (
                                            <td key={`row-total-${level}`} className="p-2 border border-gray-200 align-middle font-bold text-gray-800 bg-gray-50">
                                                {totals.rowLevelTotals.get(row.id)?.[level]?.count || ''}
                                            </td>
                                        ))}
                                        <td className="p-2 border border-gray-200 align-middle bg-gray-50">
                                            <div className="flex items-center justify-center space-x-2">
                                                <span className="font-bold text-indigo-700">{percentage.toFixed(1)}%</span>
                                                <button onClick={() => removeRow(row.id)} className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all" aria-label="Xóa dòng">&times;</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold text-xs">
                            <tr><td colSpan={2 + (questionFormatKeys.length * cognitiveLevelKeys.length) + cognitiveLevelKeys.length + 1} className="p-3 border-t-2 bg-white text-left"><button onClick={addRow} className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg> Thêm dòng kiến thức mới</button></td></tr>
                            <tr className="bg-stone-50">
                                <td colSpan={2} className="p-3 border border-gray-300 text-right uppercase tracking-wider text-gray-500">Tổng số câu</td>
                                {questionFormatKeys.map(format => cognitiveLevelKeys.map(level => <td key={`${level}-${format}`} className="p-2 border border-gray-300 align-middle text-gray-800">{totals.columnTotals?.count?.[format]?.[level] ?? 0}</td>))}
                                {cognitiveLevelKeys.map(level => (
                                    <td key={`level-total-count-${level}`} className="p-2 border border-gray-300 align-middle text-indigo-800">
                                        {totals.levelTotals?.count?.[level] || 0}
                                    </td>
                                ))}
                                <td className="p-2 border border-gray-300 align-middle bg-indigo-50 text-indigo-900">{totals.grandTotal?.count || 0}</td>
                            </tr>
                            <tr className="bg-stone-50">
                                <td colSpan={2} className="p-3 border border-gray-300 text-right uppercase tracking-wider text-gray-500">Tổng số điểm</td>
                                {questionFormatKeys.map(format => cognitiveLevelKeys.map(level => <td key={`${level}-${format}`} className="p-2 border border-gray-300 align-middle text-gray-800">{(totals.columnTotals?.points?.[format]?.[level] ?? 0).toFixed(2)}</td>))}
                                {cognitiveLevelKeys.map(level => (
                                    <td key={`level-total-points-${level}`} className="p-2 border border-gray-300 align-middle text-indigo-800">
                                        {(totals.levelTotals?.points?.[level] || 0).toFixed(2)}
                                    </td>
                                ))}
                                <td className="p-2 border border-gray-300 align-middle bg-indigo-50 text-indigo-900">{(totals.grandTotal?.points || 0).toFixed(2)}</td>
                            </tr>
                            <tr className="bg-indigo-900 text-white">
                                <td colSpan={2} className="p-3 border border-indigo-800 text-right uppercase tracking-wider">Tỷ lệ %</td>
                                {questionFormatKeys.map(format => cognitiveLevelKeys.map(level => <td key={`${level}-${format}`} className="p-2 border border-indigo-800 align-middle">{totals.grandTotal?.points > 0 ? (((totals.columnTotals?.points?.[format]?.[level] ?? 0) / totals.grandTotal.points) * 100).toFixed(0) : 0}%</td>))}
                                {cognitiveLevelKeys.map(level => (
                                    <td key={`level-total-percent-${level}`} className="p-2 border border-indigo-800 align-middle font-bold">
                                        {totals.grandTotal?.points > 0 ? (((totals.levelTotals?.points?.[level] || 0) / totals.grandTotal.points) * 100).toFixed(0) : 0}%
                                    </td>
                                ))}
                                <td className="p-2 border border-indigo-800 align-middle font-black">100%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.pdf,.docx,.html,.htm" className="hidden" />
                <div className="flex flex-wrap gap-4 justify-between items-center mt-6 pt-6 border-t border-dashed">
                    <div className="flex-1">{error && <p className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded-lg inline-block">{error}</p>}</div>
                    <div className="flex flex-wrap gap-3 justify-end items-center">
                        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Tải tệp (.docx, .pdf, .html, .csv)
                        </button>
                        <ExportDropdown onExport={handleExport} isExporting={isExporting} />
                        <button onClick={() => setIsSaveModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V4a1 1 0 10-2 0v7.586L7.707 10.293z" /><path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                            Lưu ma trận
                        </button>

                        <button onClick={handleGenerateSpec} disabled={isLoadingOutcomes} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-all">
                            {isLoadingOutcomes ? (
                                <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tạo...</>
                            ) : 'Bản Đặc Tả'}
                        </button>
                        <button
                            onClick={handleGenerateAndNavigate}
                            disabled={isGeneratingExam || (totals.grandTotal?.count || 0) === 0}
                            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-bold rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 transition-all gap-2"
                        >
                            {isGeneratingExam ? (
                                <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tạo đề...</>
                            ) : 'Tạo Đề Nhanh →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Improved Saved Matrices Library */}
            <div className="card p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">Thư viện Ma trận</h3>
                        <p className="text-sm text-gray-500">Các cấu trúc đề thi đã thiết kế.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm ma trận..."
                                value={searchSaved}
                                onChange={e => setSearchSaved(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <select
                            value={filterGrade}
                            onChange={e => setFilterGrade(e.target.value as any)}
                            className="py-2 px-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        >
                            <option value="all">Tất cả lớp</option>
                            <option value="10">Lớp 10</option>
                            <option value="11">Lớp 11</option>
                            <option value="12">Lớp 12</option>
                        </select>
                    </div>
                </div>

                {filteredMatrices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMatrices.map(matrix => (
                            <div key={matrix.id} className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all bg-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeleteMatrix(matrix.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Xóa ma trận">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs">
                                        LỚP {matrix.grade}
                                    </div>
                                    <span className="text-[10pt] text-gray-400 font-medium">{matrix.savedAt ? new Date(matrix.savedAt).toLocaleDateString('vi-VN') : ''}</span>
                                </div>
                                <h4 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{matrix.matrixName}</h4>
                                <div className="flex items-center text-sm text-gray-500 mb-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /></svg>
                                    {matrix.creatorName}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLoadMatrix(matrix.id)}
                                        className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Sửa ma trận
                                    </button>
                                    <button
                                        onClick={() => handleDuplicateMatrix(matrix.id)}
                                        className="p-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                                        title="Tạo bản sao"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-gray-500 font-medium">Cô chưa có ma trận nào được lưu.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamMatrixCreator;