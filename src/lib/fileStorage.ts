import { promises as fs } from 'fs';
import path from 'path';
import { Job } from '@/types/job';

const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Initialize jobs file if it doesn't exist
async function initializeJobsFile() {
    try {
        await fs.access(JOBS_FILE);
    } catch {
        await fs.writeFile(JOBS_FILE, JSON.stringify([], null, 2));
    }
}

export async function readJobs(): Promise<Job[]> {
    try {
        await ensureDataDir();
        await initializeJobsFile();

        const data = await fs.readFile(JOBS_FILE, 'utf8');
        return JSON.parse(data) as Job[];
    } catch (error) {
        console.error('Error reading jobs file:', error);
        return [];
    }
}

export async function writeJobs(jobs: Job[]): Promise<void> {
    try {
        await ensureDataDir();
        await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
    } catch (error) {
        console.error('Error writing jobs file:', error);
        throw new Error('Failed to save jobs data');
    }
}

export async function addJob(job: Job): Promise<Job> {
    const jobs = await readJobs();
    jobs.push(job);
    await writeJobs(jobs);
    return job;
}

export async function updateJob(id: string, updatedJob: Partial<Job>): Promise<Job | null> {
    const jobs = await readJobs();
    const jobIndex = jobs.findIndex(job => job.id === id);

    if (jobIndex === -1) {
        return null;
    }

    jobs[jobIndex] = { ...jobs[jobIndex], ...updatedJob, dateUpdated: new Date().toISOString() };
    await writeJobs(jobs);
    return jobs[jobIndex];
}

export async function deleteJob(id: string): Promise<boolean> {
    const jobs = await readJobs();
    const initialLength = jobs.length;
    const filteredJobs = jobs.filter(job => job.id !== id);

    if (filteredJobs.length === initialLength) {
        return false; // Job not found
    }

    await writeJobs(filteredJobs);
    return true;
}

export async function getJobById(id: string): Promise<Job | null> {
    const jobs = await readJobs();
    return jobs.find(job => job.id === id) || null;
}