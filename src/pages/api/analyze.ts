// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

type Analysis = {
    summary: string;
    suggestedSkills: string[];
    requirements: { required: string[]; preferred: string[]; experience: string; education: string; };
    insights: { salaryRange: string; location: string; companySize: string; competitionLevel: string; industryTrends: string[]; };
    actionItems: string[];
    provider?: string;
    fallback?: boolean;
};

/* --------------------
   Configuration
   -------------------- */
const XAI_DISABLE_MINUTES = Number(process.env.XAI_DISABLE_MINUTES || 10); // how long to skip xAI after 403
const MODEL_RETRIES = Number(process.env.MODEL_RETRIES || 1); // smaller for free keys
const BACKOFF_BASE_MS = Number(process.env.BACKOFF_BASE_MS || 500);

/* --------------------
   Clients
   -------------------- */
const xai = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
});

/* --------------------
   In-memory skip flag for xAI
   -------------------- */
let skipXAIUntil = 0; // timestamp in ms

/* --------------------
   Prompts & helpers
   -------------------- */
const systemPrompt = `You are an expert job description analyzer. Given the following job description, extract and generate a structured analysis. Output ONLY valid JSON with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the job role and responsibilities.",
  "suggestedSkills": ["An array of 5-10 key skills to highlight in a resume, based on the JD."],
  "requirements": { "required": [], "preferred": [], "experience": "Not specified", "education": "Not specified" },
  "insights": { "salaryRange": "Not specified", "location": "Not specified", "companySize": "Not specified", "competitionLevel": "Not specified", "industryTrends": [] },
  "actionItems": []
}
Use the job description to extract details accurately. For any field not mentioned, use 'Not specified' or an empty array. Keep the output concise and professional.`;

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = MODEL_RETRIES, initialDelayMs = BACKOFF_BASE_MS): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        const is429 = err?.status === 429 || String(err?.message || '').toLowerCase().includes('quota') || String(err?.message || '').toLowerCase().includes('rate');
        if (retries > 0 && is429) {
            await new Promise((r) => setTimeout(r, initialDelayMs));
            return retryWithBackoff(fn, retries - 1, initialDelayMs * 2);
        }
        throw err;
    }
}

function safeParseModelOutput(content: any): Analysis {
    try {
        if (typeof content === 'object' && content !== null) return content as Analysis;
        return JSON.parse(String(content));
    } catch {
        return {
            summary: 'Not specified',
            suggestedSkills: [],
            requirements: { required: [], preferred: [], experience: 'Not specified', education: 'Not specified' },
            insights: { salaryRange: 'Not specified', location: 'Not specified', companySize: 'Not specified', competitionLevel: 'Not specified', industryTrends: [] },
            actionItems: [],
            provider: 'local',
            fallback: true,
        };
    }
}

/* -------------------------
   Industry-agnostic local fallback (keeps prior logic)
   ------------------------- */

// (For brevity reusing the same helper implementations as before; they remain industry-agnostic.)
const broadSkillPool = [
    'communication','customer service','project management','leadership','sales','negotiation','problem solving','time management','teamwork',
    'excel','accounting','bookkeeping','financial modelling','quickbooks','marketing','seo','social media','nursing','clinical','patient care',
    'logistics','supply chain','warehouse','electrician','plumbing','carpentry','hospitality','teaching','research','data analysis',
    'javascript','typescript','react','next.js','node','python','sql','docker','kubernetes','aws','photoshop','figma'
];

function extractSkillsFromText(text: string): string[] {
    const found = new Set<string>();
    const lower = text.toLowerCase();

    // simple patterns
    const patterns = [
        /skills?:\s*([^\n]+)/i,
        /experience (with|in|using)\s*([^\.\n]+)/gi,
        /proficient in\s*([^\.\n]+)/gi,
        /knowledge of\s*([^\.\n]+)/gi,
    ];
    for (const p of patterns) {
        let m;
        while ((m = p.exec(text)) !== null) {
            const capture = m[1] ?? m[2] ?? '';
            capture.split(/,|and|\/|&/).map(s => s.trim()).filter(Boolean).forEach(s => found.add(s.replace(/\.$/, '').trim()));
        }
    }
    for (const k of broadSkillPool) if (lower.includes(k.toLowerCase())) found.add(k);
    return Array.from(found).slice(0, 10);
}

function inferIndustryTrends(text: string): string[] {
    const lower = text.toLowerCase();
    if (/(nurs|clinic|patient|medical)/i.test(lower)) return ['Telehealth adoption','Regulatory compliance','Clinical automation'];
    if (/(account|finance|audit|bookkeeping)/i.test(lower)) return ['Regulatory automation','Data analytics','Security and fraud prevention'];
    if (/(sales|retail|crm|store)/i.test(lower)) return ['E-commerce growth','Omnichannel experience','CRM personalization'];
    return ['Remote/hybrid work where possible','AI/automation increasing productivity','Focus on regulatory & sustainability concerns'];
}

function sanitizeSummary(text: string, max = 220) {
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length > max ? clean.slice(0, max).trim() + '...' : clean;
}

function basicAnalysis(jobDescription: string): Analysis {
    const suggestedSkills = extractSkillsFromText(jobDescription);
    const expMatch = jobDescription.match(/(\d+)\+?\s*(years?|yrs?)/i);
    const experience = expMatch ? `${expMatch[1]}+ years` : 'Not specified';
    const degreeMatch = jobDescription.match(/(bachelor|b\.sc|bsc|bachelor's|masters|msc|phd|associate)/i);
    let education = 'Not specified';
    if (degreeMatch) {
        const d = degreeMatch[0].toLowerCase();
        if (d.includes('master') || d.includes('msc') || d.includes('phd')) education = 'Masters or higher (preferred)';
        else if (d.includes('associate')) education = "Associate or Bachelor's (preferred)";
        else education = "Bachelor's degree (or equivalent) preferred";
    }
    const salaryMatch = jobDescription.match(/(\$|£|€|₦)\s?[\d,]+(?:\s?-\s?(?:\$|£|€|₦)?\s?[\d,]+)?/);
    const salaryRange = salaryMatch ? salaryMatch[0] : 'Not specified';
    let location = 'Not specified';
    if (/remote|work from home|wfh/i.test(jobDescription)) location = 'Remote';
    else {
        const locationMatch = jobDescription.match(/(london|new york|san francisco|lagos|nigeria|hybrid|onsite|berlin|tokyo|singapore|dubai|abuja)/i);
        if (locationMatch) location = locationMatch[0];
    }
    const companySize = /startup|early-stage|seed/i.test(jobDescription) ? 'Startup (1-50)' :
        /scaleup|series b|growth/i.test(jobDescription) ? 'Scale-up (50-250)' :
            /enterprise|1000|large company|corporation/i.test(jobDescription) ? 'Large (1000+)' : 'Not specified';
    const competitionLevel = (/senior|lead|principal|director/i.test(jobDescription) ? 'Medium' : 'High');
    const industryTrends = inferIndustryTrends(jobDescription);
    const actionItems = [
        'Tailor your resume to highlight the skills and keywords above.',
        'Include measurable results (KPIs, percentages).',
        'Prepare concise examples that demonstrate relevant experience.',
        'State remote/relocation preference if location matters.'
    ];
    return {
        summary: sanitizeSummary(jobDescription),
        suggestedSkills,
        requirements: { required: [], preferred: [], experience, education },
        insights: { salaryRange, location, companySize, competitionLevel, industryTrends },
        actionItems,
        provider: 'local',
        fallback: true,
    };
}

/* --------------------
   Model callers with XAI skip logic
   -------------------- */

async function callModelClient(client: any, model: string, bodyText: string) {
    return retryWithBackoff(async () => {
        try {
            return await client.chat.completions.create({
                model,
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: bodyText }],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 1200,
            });
        } catch (err) {
            // try again without response_format if SDK rejects it
            return await client.chat.completions.create({
                model,
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: bodyText }],
                temperature: 0.7,
                max_tokens: 1200,
            });
        }
    }, MODEL_RETRIES, BACKOFF_BASE_MS);
}

async function analyzeSingle(jobDescription: string, preferLocal = false): Promise<Analysis> {
    const text = String(jobDescription || '').trim();
    if (!text) return basicAnalysis(text);

    if (preferLocal) return basicAnalysis(text);

    // Skip xAI when we recently saw 403 for it
    const now = Date.now();
    const xaiKeyPresent = Boolean(process.env.XAI_API_KEY);
    const shouldTryXAI = xaiKeyPresent && now >= skipXAIUntil;

    if (shouldTryXAI) {
        try {
            const xaiResp: any = await callModelClient(xai, 'grok-4', text);
            const content = xaiResp?.choices?.[0]?.message?.content ?? xaiResp?.choices?.[0]?.text ?? '{}';
            const parsed = safeParseModelOutput(content);
            parsed.provider = 'xai';
            parsed.fallback = false;
            return parsed;
        } catch (err: any) {
            // If xAI returned 403 (no credits), set skip flag for a while
            if (err?.status === 403 || String(err?.message || '').toLowerCase().includes('credits')) {
                skipXAIUntil = Date.now() + XAI_DISABLE_MINUTES * 60 * 1000;
                console.warn(`xAI disabled until ${new Date(skipXAIUntil).toISOString()} due to 403/no-credits.`);
            } else {
                console.warn('xAI failed:', err?.message ?? err);
            }
            // fall through to OpenAI or local
        }
    }

    if (process.env.OPENAI_API_KEY) {
        try {
            const openaiResp: any = await callModelClient(openai, 'gpt-5', text);
            const content = openaiResp?.choices?.[0]?.message?.content ?? openaiResp?.choices?.[0]?.text ?? '{}';
            const parsed = safeParseModelOutput(content);
            parsed.provider = 'openai';
            parsed.fallback = false;
            return parsed;
        } catch (err: any) {
            console.warn('OpenAI failed:', err?.message ?? err);
        }
    }

    // final local fallback
    return basicAnalysis(text);
}

/* --------------------
   Req parsing & handler
   -------------------- */
function extractJobDescriptionsFromReq(req: NextApiRequest): string[] | null {
    const body = req.body;
    if (body?.jobDescription) {
        if (Array.isArray(body.jobDescription)) return body.jobDescription.map(String);
        return [String(body.jobDescription)];
    }
    const q = req.query;
    const qVal = q?.jobDescription;
    if (Array.isArray(qVal)) return qVal.map(String);
    if (typeof qVal === 'string') return [qVal];
    if (typeof body === 'string' && body.trim()) return [body];
    return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const jobs = extractJobDescriptionsFromReq(req);
            if (!jobs || jobs.length === 0) {
                return res.status(200).json({ success: true, message: 'Send POST { jobDescription: \"...\" } or GET ?jobDescription=...' });
            }
            const analyses = await Promise.all(jobs.map(j => analyzeSingle(j, true)));
            return res.status(200).json({ success: true, data: analyses, fallback: true, note: 'Batch GET -> used local analysis' });
        }

        if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

        const jobs = extractJobDescriptionsFromReq(req) ?? [];
        if (jobs.length === 0) return res.status(400).json({ success: false, error: 'jobDescription is required (string or array)' });

        const preferLocalForBatch = jobs.length > 1;
        if (jobs.length === 1) {
            const result = await analyzeSingle(jobs[0], false);
            return res.status(200).json({ success: true, data: result, fallback: !!result.fallback });
        }

        const results = await Promise.all(jobs.map(j => analyzeSingle(j, preferLocalForBatch)));
        return res.status(200).json({ success: true, data: results, fallback: true, note: 'Batch -> used local analysis' });
    } catch (err: any) {
        console.error('/api/analyze unexpected error:', err);
        const fallback = basicAnalysis(String((req.body?.jobDescription && typeof req.body.jobDescription === 'string') ? req.body.jobDescription : ''));
        return res.status(200).json({ success: true, data: fallback, fallback: true, message: 'Unexpected server error; returned local fallback.' });
    }
}
