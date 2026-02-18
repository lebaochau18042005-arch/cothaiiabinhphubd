import { MatrixData, SavedMatrix, SavedExam, CognitiveLevels } from '../types';

const STORAGE_KEYS = {
    MATRICES: 'geo_assistant_matrices',
    EXAMS: 'geo_assistant_exams',
    SETTINGS: 'geo_assistant_settings',
};

export const storageService = {
    // Matrices
    saveMatrix: (matrix: MatrixData & { outcomes?: Record<string, Partial<CognitiveLevels<string>>> }): SavedMatrix => {
        const savedMatrix: SavedMatrix = {
            ...matrix,
            id: crypto.randomUUID(),
            savedAt: new Date().toISOString(),
        };

        const existing = storageService.getMatrices();
        const updated = [savedMatrix, ...existing];
        localStorage.setItem(STORAGE_KEYS.MATRICES, JSON.stringify(updated));
        console.log('Matrix saved:', savedMatrix.id); // Validating save
        return savedMatrix;
    },

    getMatrices: (): SavedMatrix[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.MATRICES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading matrices:', error);
            return [];
        }
    },

    deleteMatrix: (id: string) => {
        const existing = storageService.getMatrices();
        const updated = existing.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MATRICES, JSON.stringify(updated));
    },

    // Exams
    saveExam: (exam: SavedExam) => {
        const existing = storageService.getExams();
        const updated = [exam, ...existing];
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));
    },

    getExams: (): SavedExam[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading exams:', error);
            return [];
        }
    },

    deleteExam: (id: string) => {
        const existing = storageService.getExams();
        const updated = existing.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));
    },

    // Generic
    clearAll: () => {
        localStorage.removeItem(STORAGE_KEYS.MATRICES);
        localStorage.removeItem(STORAGE_KEYS.EXAMS);
    }
};
