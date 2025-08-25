'use client';

import React, { useState, useEffect } from 'react';
import { Job, JobFormData, JobStatus, ApiResponse } from '@/types/job';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface JobFormProps {
    job?: Job;
    onSubmit: (data: JobFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const statusOptions: { value: JobStatus; label: string }[] = [
    { value: 'Applied', label: 'Applied' },
    { value: 'Interviewing', label: 'Interviewing' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Offer', label: 'Offer' },
    { value: 'Withdrawn', label: 'Withdrawn' }
];

export const JobForm: React.FC<JobFormProps> = ({
                                                    job,
                                                    onSubmit,
                                                    onCancel,
                                                    isSubmitting = false
                                                }) => {
    const [formData, setFormData] = useState<JobFormData>({
        jobTitle: '',
        companyName: '',
        applicationLink: '',
        status: 'Applied'
    });

    const [errors, setErrors] = useState<Partial<JobFormData>>({});

    useEffect(() => {
        if (job) {
            setFormData({
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                applicationLink: job.applicationLink,
                status: job.status
            });
        }
    }, [job]);

    const validateForm = (): boolean => {
        const newErrors: Partial<JobFormData> = {};

        if (!formData.jobTitle.trim()) {
            newErrors.jobTitle = 'Job title is required';
        }

        if (!formData.companyName.trim()) {
            newErrors.companyName = 'Company name is required';
        }

        if (!formData.applicationLink.trim()) {
            newErrors.applicationLink = 'Application link is required';
        } else {
            // Basic URL validation
            try {
                new URL(formData.applicationLink);
            } catch {
                newErrors.applicationLink = 'Please enter a valid URL';
            }
        }

        if (!formData.status) {
            // @ts-ignore
            newErrors.status = 'Status is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            // Reset form if it's a new job (not editing)
            if (!job) {
                setFormData({
                    jobTitle: '',
                    companyName: '',
                    applicationLink: '',
                    status: 'Applied'
                });
                setErrors({});
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleInputChange = (field: keyof JobFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Job Title"
                value={formData.jobTitle}
                onChange={handleInputChange('jobTitle')}
                error={errors.jobTitle}
                placeholder="e.g., Software Engineer"
                required
            />

            <Input
                label="Company Name"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                error={errors.companyName}
                placeholder="e.g., Google"
                required
            />

            <Input
                label="Application Link"
                type="url"
                value={formData.applicationLink}
                onChange={handleInputChange('applicationLink')}
                error={errors.applicationLink}
                placeholder="https://example.com/jobs/123"
                helperText="Link to the job posting or application page"
                required
            />

            <Select
                label="Application Status"
                value={formData.status}
                onChange={handleInputChange('status')}
                error={errors.status}
                options={statusOptions}
                required
            />

            <div className="flex space-x-3 pt-4">
                <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {job ? 'Update Job' : 'Add Job'}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
};