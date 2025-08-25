import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { Job, JobFormData, ApiResponse } from "@/types/job";
import { readJobs, addJob } from "@/lib/fileStorage";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>,
) {
    try {
        if (req.method === "GET") {
            const jobs = await readJobs();
            const sortedJobs = jobs.sort(
                (a, b) =>
                    new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
            );

            return res.status(200).json({
                success: true,
                data: sortedJobs,
                message: `Retrieved ${jobs.length} job applications`,
            });
        }

        if (req.method === "POST") {
            const body: JobFormData = req.body;
            const { jobTitle, companyName, applicationLink, status } = body;

            if (!jobTitle?.trim() || !companyName?.trim() || !applicationLink?.trim() || !status) {
                return res
                    .status(400)
                    .json({ success: false, error: "All fields are required" });
            }

            try {
                new URL(applicationLink);
            } catch {
                return res
                    .status(400)
                    .json({ success: false, error: "Invalid URL" });
            }

            const newJob: Job = {
                id: uuidv4(),
                jobTitle: jobTitle.trim(),
                companyName: companyName.trim(),
                applicationLink: applicationLink.trim(),
                status,
                dateAdded: new Date().toISOString(),
            };

            const createdJob = await addJob(newJob);

            return res.status(201).json({
                success: true,
                data: createdJob,
                message: "Job application added successfully",
            });
        }

        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error("Error:", error);
        return res
            .status(500)
            .json({ success: false, error: "Internal Server Error" });
    }
}
