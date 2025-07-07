'use server';

/**
 * @fileOverview AI flow to suggest potential family connections based on user data.
 *
 * - suggestFamilyConnections - Function to suggest family connections.
 * - SuggestFamilyConnectionsInput - Input type for suggestFamilyConnections.
 * - SuggestFamilyConnectionsOutput - Output type for suggestFamilyConnections.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married']),
  fatherName: z.string().optional().describe("The name of the user's father, if known but not linked."),
  motherName: z.string().optional().describe("The name of the user's mother, if known but not linked."),
  spouseName: z.string().optional().describe("The name of the user's spouse, if known but not linked."),
});

const CommunityProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  surname: z.string(),
  gender: z.enum(['male', 'female']),
  birthYear: z.string(),
  spouseId: z.string().optional(),
});

const SuggestFamilyConnectionsInputSchema = z.object({
  userProfile: UserProfileSchema.describe(
    'The profile of the user for whom we are suggesting connections.'
  ),
  communityProfiles: z
    .array(CommunityProfileSchema)
    .describe(
      'A list of approved community members to search for connections.'
    ),
});

export type SuggestFamilyConnectionsInput = z.infer<
  typeof SuggestFamilyConnectionsInputSchema
>;

const SuggestedConnectionSchema = z.object({
  userId: z
    .string()
    .describe('The ID of the suggested relative from the community.'),
  name: z.string().describe('The full name of the suggested relative.'),
  relationship: z
    .enum(['father', 'mother', 'spouse'])
    .describe('The suggested relationship to the user.'),
  reasoning: z
    .string()
    .describe('The reasoning for this specific suggestion.'),
});

const SuggestFamilyConnectionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestedConnectionSchema)
    .describe('A list of potential family connections.'),
});

export type SuggestFamilyConnectionsOutput = z.infer<
  typeof SuggestFamilyConnectionsOutputSchema
>;

export async function suggestFamilyConnections(
  input: SuggestFamilyConnectionsInput
): Promise<SuggestFamilyConnectionsOutput> {
  return suggestFamilyConnectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFamilyConnectionsPrompt',
  input: {schema: SuggestFamilyConnectionsInputSchema},
  output: {schema: SuggestFamilyConnectionsOutputSchema},
  prompt: `You are an expert genealogist. Your task is to find potential relatives for a given user from a list of community members.

Analyze the user's profile and compare it against the provided community profiles. Your goal is to suggest likely candidates for the user's father, mother, and spouse.

User Profile to find relatives for:
- Name: {{userProfile.name}} ({{userProfile.surname}})
- Gender: {{userProfile.gender}}
- Marital Status: {{userProfile.maritalStatus}}
- Known Father's Name: {{userProfile.fatherName}}
- Known Mother's Name: {{userProfile.motherName}}
- Known Spouse's Name: {{userProfile.spouseName}}

Community Profiles to search within:
{{#each communityProfiles}}
- ID: {{this.id}}, Name: {{this.name}}, Surname: {{this.surname}}, Gender: {{this.gender}}, Birth Year: {{this.birthYear}}, Spouse ID: {{this.spouseId}}
{{/each}}

Here are the rules for making suggestions:
1.  **Father:** Must be male. Surname should ideally match the user's surname. Must be of an appropriate age to be a parent.
2.  **Mother:** Must be female. Must be of an appropriate age to be a parent.
3.  **Spouse:** Must be of the opposite gender. Must not already have a spouse linked (unless it's the user). Must be of a similar age.
4.  **Reasoning:** For each suggestion, provide a concise but clear reason. Mention matching surnames, age appropriateness, or other logical connections.
5.  If the user has a known name for a relative (e.g., 'fatherName'), prioritize finding a match for that name.
6.  Do not suggest a person if they are not a strong candidate. It is better to have no suggestions than bad ones.
7.  Return an empty array of suggestions if no suitable candidates are found.
`,
});

const suggestFamilyConnectionsFlow = ai.defineFlow(
  {
    name: 'suggestFamilyConnectionsFlow',
    inputSchema: SuggestFamilyConnectionsInputSchema,
    outputSchema: SuggestFamilyConnectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
