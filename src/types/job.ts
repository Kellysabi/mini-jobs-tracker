// @/types/job.ts
export interface Job {
    id: string;
    jobTitle: string;
    companyName: string;
    applicationLink: string;
    status: JobStatus;
    dateAdded: string;
    dateUpdated?: string;
}

export type JobStatus =
    | 'Applied'
    | 'Interviewing'
    | 'Rejected'
    | 'Offer'
    | 'Withdrawn';

export interface JobFormData {
    jobTitle: string;
    companyName: string;
    applicationLink: string;
    status: JobStatus;
}

export interface JobAnalysis {
    id: string;
    summary: string;
    suggestedSkills: string[];
    matchScore: number;
    requirements: {
        required: string[];
        preferred: string[];
        experience: string;
        education: string;
    };
    insights: {
        salaryRange?: string;
        location?: string;
        companySize?: string;
        industryTrends: string[];
        competitionLevel: 'Low' | 'Medium' | 'High';
    };
    actionItems: string[];
    interviewQuestions: string[];
    createdAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    rateLimitInfo?: {
        remaining: number;
        resetTime: number;
    };
}