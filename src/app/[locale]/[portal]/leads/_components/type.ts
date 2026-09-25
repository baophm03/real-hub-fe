export interface Customer {
    id: string;
    fullName: string;
    phone?: string;
}

export interface Property {
    id: string;
    title: string;
    propertyCode: string;
}

export interface WorkflowState {
    stateName: string;
    columnName: string;
    isInitial?: boolean;
    sortOrder?: number;
    color?: string | null;
}

export const sourceOptions = [
    { value: "WEBSITE", label: "Website" },
    { value: "SALES_LINK", label: "Link sales" },
    { value: "CTV_LINK", label: "Link CTV" },
    { value: "AGENCY_MARKETING", label: "Marketing" },
    { value: "MANUAL_INPUT", label: "Nhập tay" },
    { value: "LEAD_POOL", label: "Lead pool" },
    { value: "IMPORT", label: "Nhập file" },
];
