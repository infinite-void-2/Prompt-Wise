import { TaskCategory } from '../types/index.js';

export interface ExamplePrompt {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  prompt: string;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'email-filler',
    title: 'Thank-You Email (Polite Filler)',
    category: 'Writing',
    description: 'Demonstrates removing conversational filler while keeping the friendly tone and 80-word limit.',
    prompt:
      'Hey, could you please help me write a short thank-you email to my professor for explaining recursion today? Keep it friendly and under 80 words.',
  },
  {
    id: 'strict-json',
    title: 'Strict JSON Entity Extraction',
    category: 'Data Extraction',
    description: 'Enforces pure JSON output with exact keys and strict prohibitions against Markdown codeblocks.',
    prompt:
      'Extract name and age from the text. Return valid JSON only with keys name and age. No Markdown, no extra keys.',
  },
  {
    id: 'java-constraints',
    title: 'Java 21 Standard Library Only',
    category: 'Coding',
    description: 'Enforces version requirements, exclusion of third-party libraries, and mandatory Big-O complexity.',
    prompt:
      'Write a Java 21 program using only the standard library. Do not use Python or third-party packages. Include time complexity.',
  },
  {
    id: 'delimited-csv',
    title: 'Delimited Data Extraction',
    category: 'Data Extraction',
    description: 'Specifies exact CSV headers, semicolon delimiters, and explicit literal NULL substitution.',
    prompt:
      'Parse the sales data. CSV headers are order_id, customer_name, total_amount, status. Output one row per record using semicolon delimiters. If total_amount is missing, write NULL.',
  },
  {
    id: 'markdown-table',
    title: 'Markdown Table Comparison',
    category: 'Data Extraction',
    description: 'Strict format constraint requiring a 3-column table with absolutely no introductory or concluding prose.',
    prompt:
      'Create a Markdown table comparing React and Vue. Columns must be: Framework, Learning Curve, State Management. Return only the table with no prose before or after it.',
  },
];
