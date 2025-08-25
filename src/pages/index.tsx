'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Job, JobFormData, ApiResponse } from '@/types/job';
import { JobForm } from '@/components/JobForm';
import { JobTable } from '@/components/JobTable';
import { JobAnalyzer } from '@/components/JobAnalyzer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus, Briefcase, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from API
  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/jobs');
      const data: ApiResponse<Job[]> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(errorMessage);
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Handle form submission (add or edit)
  const handleFormSubmit = async (formData: JobFormData) => {
    setIsSubmitting(true);

    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<Job> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to ${editingJob ? 'update' : 'add'} job`);
      }

      // Refresh jobs list
      await fetchJobs();

      // Close modal and reset editing state
      setIsModalOpen(false);
      setEditingJob(undefined);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit job
  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  // Handle delete job
  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete job');
      }

      // Refresh jobs list
      await fetchJobs();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job';
      setError(errorMessage);
      console.error('Error deleting job:', err);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingJob(undefined);
  };

  // Calculate statistics
  const stats = {
    total: jobs.length,
    applied: jobs.filter(job => job.status === 'Applied').length,
    interviewing: jobs.filter(job => job.status === 'Interviewing').length,
    offers: jobs.filter(job => job.status === 'Offer').length,
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mini Job Tracker
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track your job applications, stay organized, and never miss an opportunity.
              Built for the AppEasy Technical Assessment.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applied</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.applied}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interviewing</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.interviewing}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Offers</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.offers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <div className="mt-3">
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setError(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* AI Job Analyzer Section */}
          <div className="mb-8">
            <JobAnalyzer />
          </div>

          {/* Jobs Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Job Applications</h2>
                  <p className="text-sm text-gray-500">
                    Manage and track all your job applications in one place
                  </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Job Application
                </Button>
              </div>
            </div>

            <div className="p-6">
              <JobTable
                  jobs={jobs}
                  onEdit={handleEditJob}
                  onDelete={handleDeleteJob}
                  isLoading={isLoading}
              />
            </div>
          </div>

          {/* Add/Edit Job Modal */}
          <Modal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              title={editingJob ? 'Edit Job Application' : 'Add New Job Application'}
              maxWidth="lg"
          >
            <JobForm
                job={editingJob}
                onSubmit={handleFormSubmit}
                onCancel={handleModalClose}
                isSubmitting={isSubmitting}
            />
          </Modal>
        </div>
      </div>
  );
}