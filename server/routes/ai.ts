import { Router } from 'express';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import { requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

export const aiRouter = Router();

aiRouter.use(requireAuth, requireTenant);

const draftScenariosSchema = z
  .object({
    decisionTitle: z.string().trim().min(1).max(300),
    decisionSummary: z.string().trim().max(5_000).optional().default(''),
    domain: z.string().trim().max(100).optional().default(''),
    institutionName: z.string().trim().max(300).optional().default(''),
  })
  .strict();

function buildDeterministicScenarios(decisionTitle: string) {
  return [
    {
      scenarioType: 'conservative',
      title: `[Deterministic] Minimal Pilot: ${decisionTitle}`,
      description: `Implement ${decisionTitle} as an optional faculty/student trial in 2 non-core sections with human oversight.`,
      keyAssumptions: ['Faculty retain total grading control', 'No automation of student status'],
      nonTechDrivers: {
        demographics: 'Traditional undergraduate preferences',
        economics: 'Low cost pilot ($5k budget)',
        policy: 'Complies fully with FERPA',
        geopolitics: 'Domestic server hosting',
      },
      reversibilityRating: 5,
      isAiDrafted: false,
      generationMode: 'deterministic' as const,
    },
    {
      scenarioType: 'moderate',
      title: '[Deterministic] Hybrid Co-Pilot Deployment',
      description: `Integrate ${decisionTitle} to assist human instructors with initial draft analysis, requiring instructor approval for all scores.`,
      keyAssumptions: ['Reduces instructor prep time by 25%', 'Human approval gate mandatory'],
      nonTechDrivers: {
        demographics: 'Rising class enrollments',
        economics: 'Moderate subscription cost',
        policy: 'Requires faculty senate co-design',
        geopolitics: 'Standard SLA',
      },
      reversibilityRating: 4,
      isAiDrafted: false,
      generationMode: 'deterministic' as const,
    },
    {
      scenarioType: 'ambitious',
      title: '[Deterministic] Institution-Wide Strategic Modernization',
      description: `Full scale integration of ${decisionTitle} across all undergraduate programs with custom fine-tuned institutional domain models.`,
      keyAssumptions: ['High faculty adoption', 'Seamless LMS integration'],
      nonTechDrivers: {
        demographics: 'Competitive student recruitment',
        economics: 'Significant capital investment',
        policy: 'New institutional AI policy framework',
        geopolitics: 'Cloud infrastructure contract',
      },
      reversibilityRating: 3,
      isAiDrafted: false,
      generationMode: 'deterministic' as const,
    },
    {
      scenarioType: 'adverse',
      title: '[Deterministic] Algorithmic Misalignment & Student Dispute Backlog',
      description:
        'Systemic false positive flags and biased feedback trigger widespread student appeals, faculty pushback, and accreditor inquiry.',
      keyAssumptions: ['Model lacks discipline-specific nuance', 'Students lose trust in evaluation'],
      nonTechDrivers: {
        demographics: 'Disproportionately affects ESL/first-gen students',
        economics: 'High administrative appeal handling cost',
        policy: 'Accreditor warning on substantive interaction',
        geopolitics: 'API downtime during finals',
      },
      reversibilityRating: 2,
      isAiDrafted: false,
      generationMode: 'deterministic' as const,
    },
    {
      scenarioType: 'disruptive',
      title: '[Deterministic] Curriculum Disintermediation & Value Erosion',
      description:
        'Complete breakdown of authentic student assessment leading to credential devaluation and loss of institutional trust.',
      keyAssumptions: ['Students use GAI to bypass core learning', 'Faculty morale collapses'],
      nonTechDrivers: {
        demographics: 'Enrollment drop due to loss of prestige',
        economics: 'Long-term revenue risk',
        policy: 'Emergency return to paper blue-books',
        geopolitics: 'Global credential scrutiny',
      },
      reversibilityRating: 1,
      isAiDrafted: false,
      generationMode: 'deterministic' as const,
    },
  ];
}

aiRouter.post(
  '/draft-scenarios',
  requireCapability('edit_decisions'),
  asyncHandler(async (req, res) => {
    const input = draftScenariosSchema.parse(req.body);
    if (!config.aiEnabled) {
      res.json({
        data: {
          scenarios: buildDeterministicScenarios(input.decisionTitle),
          mode: 'deterministic',
          note: 'Deterministic mode — no external AI call. Set ENABLE_AI=true and GEMINI_API_KEY to enable live model generation.',
        },
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const prompt = `You are the Proteus Higher Education AI Compass Intelligence Engine.
Generate 5 distinct scenarios (conservative, moderate, ambitious, adverse, disruptive) for this proposed decision:
Title: "${input.decisionTitle}"
Summary: "${input.decisionSummary}"
Domain: "${input.domain}"
Institution: "${input.institutionName}"

Each scenario must include scenarioType, title prefixed with [AI-Drafted], description, keyAssumptions (2 strings), nonTechDrivers (demographics, economics, policy, geopolitics), and reversibilityRating (1-5).
Return strict JSON with a top-level "scenarios" array.`;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const clean = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed.scenarios) || parsed.scenarios.length < 5) {
        throw new Error('Invalid scenario response from model.');
      }
      res.json({
        data: {
          scenarios: parsed.scenarios.map((scenario: Record<string, unknown>) => ({
            ...scenario,
            isAiDrafted: true,
            generationMode: 'ai',
          })),
          mode: 'ai_assisted',
        },
      });
    } catch (error) {
      res.json({
        data: {
          scenarios: buildDeterministicScenarios(input.decisionTitle),
          mode: 'deterministic_fallback',
          note: `AI generation failed; deterministic templates were served instead. ${
            error instanceof Error ? error.message : ''
          }`.trim(),
        },
      });
    }
  }),
);
