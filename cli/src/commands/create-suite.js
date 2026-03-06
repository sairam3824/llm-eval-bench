import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { input, select, confirm, number } from '@inquirer/prompts';
import { v4 as uuid } from 'uuid';

export async function createSuiteCommand(options) {
  console.log(chalk.hex('#6366F1')('\n🧪 Interactive Test Suite Creator\n'));

  const name = await input({ message: 'Suite name:', validate: v => v.length > 0 || 'Required' });
  const description = await input({ message: 'Description (optional):' });
  const category = await select({
    message: 'Category:',
    choices: [
      { name: 'Coding', value: 'coding' },
      { name: 'Reasoning', value: 'reasoning' },
      { name: 'Summarization', value: 'summarization' },
      { name: 'Creative Writing', value: 'creative-writing' },
      { name: 'Instruction Following', value: 'instruction-following' },
      { name: 'Custom', value: 'custom' },
    ],
  });

  const numTests = await number({ message: 'How many test cases?', default: 3, min: 1, max: 50 });

  const tests = [];
  for (let i = 0; i < numTests; i++) {
    console.log(chalk.gray(`\n  Test ${i + 1} of ${numTests}`));

    const prompt = await input({
      message: `Prompt ${i + 1}:`,
      validate: v => v.length > 0 || 'Required',
    });

    const criteriaStr = await input({
      message: 'Expected criteria (comma-separated):',
      default: 'accurate, relevant, concise',
    });

    const difficulty = await select({
      message: 'Difficulty:',
      choices: [
        { name: 'Easy', value: 'easy' },
        { name: 'Medium', value: 'medium' },
        { name: 'Hard', value: 'hard' },
      ],
    });

    tests.push({
      id: `test-${i + 1}`,
      prompt,
      expected_criteria: criteriaStr.split(',').map(s => s.trim()).filter(Boolean),
      category,
      difficulty,
    });
  }

  const suite = { name, description, category, tests };
  const outPath = path.resolve(options.output);

  fs.writeFileSync(outPath, JSON.stringify(suite, null, 2), 'utf-8');
  console.log(chalk.green(`\n✓ Suite saved to: ${outPath}`));
  console.log(chalk.gray(`  Run it with: llm-bench run --suite ${outPath}\n`));
}
