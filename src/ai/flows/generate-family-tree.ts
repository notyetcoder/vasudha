'use server';

/**
 * @fileOverview A family tree generation AI agent.
 *
 * - generateFamilyTree - A function that handles the family tree generation process.
 * - GenerateFamilyTreeInput - The input type for the generateFamilyTree function.
 * - GenerateFamilyTreeOutput - The return type for the generateFamilyTree function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFamilyTreeInputSchema = z.object({
  userData: z.string().describe('User data including surname, name, gender, marital status, parents and spouse names, profile picture (optional), and birth month/year.'),
});
export type GenerateFamilyTreeInput = z.infer<typeof GenerateFamilyTreeInputSchema>;

const GenerateFamilyTreeOutputSchema = z.object({
  familyTreeVisualization: z.string().describe('A visualization of the family tree in a tree format, suggesting connections if available.'),
});
export type GenerateFamilyTreeOutput = z.infer<typeof GenerateFamilyTreeOutputSchema>;

export async function generateFamilyTree(input: GenerateFamilyTreeInput): Promise<GenerateFamilyTreeOutput> {
  return generateFamilyTreeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFamilyTreePrompt',
  input: {schema: GenerateFamilyTreeInputSchema},
  output: {schema: GenerateFamilyTreeOutputSchema},
  prompt: `You are an expert in genealogy and family history visualization.

You will use the provided user data to generate a family tree visualization.

Consider the relationships between family members and suggest connections if possible.

User Data: {{{userData}}}`,
});

const generateFamilyTreeFlow = ai.defineFlow(
  {
    name: 'generateFamilyTreeFlow',
    inputSchema: GenerateFamilyTreeInputSchema,
    outputSchema: GenerateFamilyTreeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
