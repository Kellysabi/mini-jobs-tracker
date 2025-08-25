import { NextRequest, NextResponse } from 'next/server';
import { Job, JobFormData, ApiResponse } from '@/types/job';
import { getJobById, updateJob, deleteJob } from '@/lib/fileStorage';

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/jobs/[id] - Get specific job
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<Job>>> {
    try {
        const { id } = params;

        const job = await getJobById(id);

        if (!job) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Job application not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: job,
            message: 'Job application retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching job:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch job application'
            },
            { status: 500 }
        );
    }
}

// PUT /api/jobs/[id] - Update specific job
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<Job>>> {
    try {
        const { id } = params;
        const body: JobFormData = await request.json();

        // Validate required fields
        const { jobTitle, companyName, applicationLink, status } = body;

        if (!jobTitle?.trim() || !companyName?.trim() || !applicationLink?.trim() || !status) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'All fields are required'
                },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(applicationLink);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please provide a valid URL for the application link'
                },
                { status: 400 }
            );
        }

        // Check if job exists
        const existingJob = await getJobById(id);
        if (!existingJob) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Job application not found'
                },
                { status: 404 }
            );
        }

        // Update job
        const updatedJobData = {
            jobTitle: jobTitle.trim(),
            companyName: companyName.trim(),
            applicationLink: applicationLink.trim(),
            status
        };

        const updatedJob = await updateJob(id, updatedJobData);

        return NextResponse.json({
            success: true,
            data: updatedJob!,
            message: 'Job application updated successfully'
        });

    } catch (error) {
        console.error('Error updating job:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update job application'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/jobs/[id] - Delete specific job
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
    try {
        const { id } = params;

        const deleted = await deleteJob(id);

        if (!deleted) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Job application not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: null,
            message: 'Job application deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting job:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete job application'
            },
            { status: 500 }
        );
    }
}