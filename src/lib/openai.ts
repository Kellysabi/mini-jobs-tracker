import OpenAI from 'openai';
import { JobAnalysis } from '@/types/job';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        // Fallback when no API key is provided
        return {
            summary: "AI analysis requires OpenAI API key. This is a placeholder summary showing that the job posting has been received and would normally be analyzed for key requirements, responsibilities, and company culture.",
            suggestedSkills: [
                "Communication Skills",
                "Problem Solving",
                "Teamwork"
            ]
        };
    }

    try {
        const prompt = `
    Please analyze the following job description and provide:
    1. A concise summary (2-3 sentences) of the role and key requirements
    2. The top 3 most important skills a candidate should highlight in their resume for this position

    Job Description:
    ${jobDescription}

    Please respond in the following JSON format:
    {
      "summary": "Your summary here",
      "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3"]
    }
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful career advisor and recruiter. Analyze job descriptions and provide actionable insights for job seekers."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }

        // Try to parse JSON response
        try {
            const parsed = JSON.parse(content);
            return {
                summary: parsed.summary || "Unable to generate summary",
                suggestedSkills: Array.isArray(parsed.suggestedSkills) ? parsed.suggestedSkills : []
            };
        } catch (parseError) {
            // Fallback if JSON parsing fails
            return {
                summary: content.substring(0, 300) + "...",
                suggestedSkills: [
                    "Technical Skills",
                    "Communication",
                    "Problem Solving"
                ]
            };
        }

    } catch (error) {
        console.error('OpenAI API Error:', error);

        // Provide a meaningful fallback
        return {
            summary: "Unable to analyze job description at this time. Please check your OpenAI API configuration.",
            suggestedSkills: [
                "Core Technical Skills",
                "Communication & Collaboration",
                "Industry Knowledge"
            ]
        };
    }
}