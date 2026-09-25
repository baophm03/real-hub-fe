export interface WorkflowState {
    stateName: string;
    columnName: string;
    isInitial?: boolean;
    sortOrder?: number;
    color?: string | null;
}

export const txOptions = [
    { value: "SALE", label: "Bán" },
    { value: "RENT", label: "Cho thuê" },
    { value: "TRANSFER", label: "Chuyển nhượng" },
];
