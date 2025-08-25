'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { JobAnalysis, ApiResponse } from '@/types/job';
import { Brain, Lightbulb, FileText, AlertCircle } from 'lucide-react';

export const JobAnalyzer: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            setError('Please enter a job description');
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobDescription: jobDescription.trim() }),
            });

            const data: ApiResponse<JobAnalysis> = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to analyze job description');
            }

            setAnalysis(data.data!);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage.includes('quota exceeded')
                ? 'API quota exceeded. A basic analysis was performed. Please try again later or check your API plan.'
                : errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClear = () => {
        setJobDescription('');
        setAnalysis(null);
        setError(null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">AI Job Description Analyzer</h2>
            </div>

            <p className="text-gray-600 text-sm mb-4">
                Paste a job description (up to 15,000 characters) below and get AI-powered insights including a summary and suggested skills to highlight for any industry.
            </p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description
                    </label>
                    <textarea
                        id="jobDescription"
                        rows={12}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here (up to 15,000 characters)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {jobDescription.length}/15000 characters
                    </p>
                </div>

                <div className="flex space-x-3">
                    <Button
                        onClick={handleAnalyze}
                        loading={isAnalyzing}
                        disabled={isAnalyzing || !jobDescription.trim()}
                        className="flex items-center"
                    >
                        <Brain className="w-4 h-4 mr-2" />
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Job'}
                    </Button>

                    {(jobDescription || analysis || error) && (
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            disabled={isAnalyzing}
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {analysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-4">
                        <div>
                            <div className="flex items-center mb-2">
                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                <h3 className="text-sm font-semibold text-blue-900">Job Summary</h3>
                            </div>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {analysis.summary || 'No summary available'}
                            </p>
                        </div>

                        {analysis.suggestedSkills && Array.isArray(analysis.suggestedSkills) && analysis.suggestedSkills.length > 0 && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
                                    <h3 className="text-sm font-semibold text-blue-900">Suggested Skills to Highlight</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.suggestedSkills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(!analysis.suggestedSkills || !Array.isArray(analysis.suggestedSkills) || analysis.suggestedSkills.length === 0) && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
                                    <h3 className="text-sm font-semibold text-blue-900">Suggested Skills to Highlight</h3>
                                </div>
                                <p className="text-sm text-blue-700 italic">No specific skills suggestions available for this job description.</p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center mb-2">
                                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                                <h3 className="text-sm font-semibold text-blue-900">Requirements</h3>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900">Required</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-800">
                                        {analysis.requirements.required.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900">Preferred</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-800">
                                        {analysis.requirements.preferred.map((pref, index) => (
                                            <li key={index}>{pref}</li>
                                        ))}
                                    </ul>
                                </div>
                                <p className="text-sm text-blue-800">
                                    <strong>Experience:</strong> {analysis.requirements.experience}
                                </p>
                                <p className="text-sm text-blue-800">
                                    <strong>Education:</strong> {analysis.requirements.education}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
                                <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
                                <h3 className="text-sm font-semibold text-blue-900">Insights</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-blue-800">
                                    <strong>Salary Range:</strong> {analysis.insights.salaryRange || 'Not specified'}
                                </p>
                                <p className="text-sm text-blue-800">
                                    <strong>Location:</strong> {analysis.insights.location || 'Not specified'}
                                </p>
                                <p className="text-sm text-blue-800">
                                    <strong>Company Size:</strong> {analysis.insights.companySize || 'Not specified'}
                                </p>
                                <p className="text-sm text-blue-800">
                                    <strong>Competition Level:</strong> {analysis.insights.competitionLevel}
                                </p>
                                <div>
                                    <h4 className="text-sm font-medium text-blue-900">Industry Trends</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-800">
                                        {analysis.insights.industryTrends.map((trend, index) => (
                                            <li key={index}>{trend}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
                                <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
                                <h3 className="text-sm font-semibold text-blue-900">Action Items</h3>
                            </div>
                            <ul className="list-disc list-inside text-sm text-blue-800">
                                {analysis.actionItems.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-blue-100 rounded-md p-3 mt-4">
                            <p className="text-xs text-blue-700">
                                💡 <strong>Pro Tip:</strong> Use these insights to tailor your resume and cover letter
                                to better match what the employer is looking for.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};