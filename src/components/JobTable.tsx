'use client';

import React, { useState } from 'react';
import { Job } from '@/types/job';
import { Button } from '@/components/ui/Button';
import { Edit2, Trash2, ExternalLink, Calendar } from 'lucide-react';

interface JobTableProps {
    jobs: Job[];
    onEdit: (job: Job) => void;
    onDelete: (jobId: string) => void;
    isLoading?: boolean;
}

export const JobTable: React.FC<JobTableProps> = ({
                                                      jobs,
                                                      onEdit,
                                                      onDelete,
                                                      isLoading = false
                                                  }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (jobId: string) => {
        if (deletingId) return;

        if (confirm('Are you sure you want to delete this job application?')) {
            setDeletingId(jobId);
            try {
                await onDelete(jobId);
            } finally {
                setDeletingId(null);
            }
        }
    };

    const getStatusBadgeClasses = (status: string) => {
        const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

        switch (status) {
            case 'Applied':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'Interviewing':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'Offer':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'Rejected':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'Withdrawn':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications yet</h3>
                <p className="text-gray-500">Start tracking your job applications by adding your first one above.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {job.jobTitle}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                        <a
                                            href={job.applicationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-blue-600 hover:text-blue-500"
                                        >
                                            View Application
                                            <ExternalLink className="ml-1 w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.companyName}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                <span className={getStatusBadgeClasses(job.status)}>
                  {job.status}
                </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(job.dateAdded)}
                            {job.dateUpdated && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Updated: {formatDate(job.dateUpdated)}
                                </div>
                            )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(job)}
                                className="inline-flex items-center"
                            >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Edit
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(job.id)}
                                loading={deletingId === job.id}
                                disabled={deletingId === job.id}
                                className="inline-flex items-center"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};