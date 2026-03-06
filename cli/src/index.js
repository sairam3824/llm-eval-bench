#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { runCommand } from './commands/run.js';
import { compareCommand } from './commands/compare.js';
import { reportCommand } from './commands/report.js';
import { createSuiteCommand } from './commands/create-suite.js';

const ASCII = `
${chalk.hex('#6366F1')('  ██╗     ██╗     ███╗   ███╗    ███████╗██╗   ██╗ █████╗ ██╗')}
${chalk.hex('#818CF8')('  ██║     ██║     ████╗ ████║    ██╔════╝██║   ██║██╔══██╗██║')}
${chalk.hex('#A5B4FC')('  ██║     ██║     ██╔████╔██║    █████╗  ██║   ██║███████║██║')}
${chalk.hex('#C7D2FE')('  ██║     ██║     ██║╚██╔╝██║    ██╔══╝  ╚██╗ ██╔╝██╔══██║██║')}
${chalk.hex('#E0E7FF')('  ███████╗███████╗██║ ╚═╝ ██║    ███████╗ ╚████╔╝ ██║  ██║███████╗')}
${chalk.hex('#F0F6FF')('  ╚══════╝╚══════╝╚═╝     ╚═╝    ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝')}
${chalk.hex('#6366F1')('  ██████╗ ███████╗███╗   ██╗ ██████╗██╗  ██╗')}
${chalk.hex('#818CF8')('  ██╔══██╗██╔════╝████╗  ██║██╔════╝██║  ██║')}
${chalk.hex('#A5B4FC')('  ██████╔╝█████╗  ██╔██╗ ██║██║     ███████║')}
${chalk.hex('#C7D2FE')('  ██╔══██╗██╔══╝  ██║╚██╗██║██║     ██╔══██║')}
${chalk.hex('#E0E7FF')('  ██████╔╝███████╗██║ ╚████║╚██████╗██║  ██║')}
${chalk.hex('#F0F6FF')('  ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝')}
`;

console.log(ASCII);
console.log(chalk.hex('#8B949E')('  Benchmark & Compare LLMs Across Providers\n'));

program
  .name('llm-bench')
  .description('LLM Eval Bench CLI — benchmark and compare LLMs')
  .version('1.0.0');

program
  .command('run')
  .description('Run a benchmark suite')
  .option('-s, --suite <path>', 'Path to test suite JSON file')
  .option('-m, --models <models>', 'Comma-separated model IDs to benchmark')
  .option('-j, --judge <model>', 'Judge model (default: gpt-4o)', 'gpt-4o')
  .option('-u, --url <url>', 'API server URL', 'http://localhost:3000')
  .action(runCommand);

program
  .command('compare')
  .description('Compare specific models on the last run or a specific run')
  .option('-m, --models <models>', 'Comma-separated model names to compare')
  .option('-r, --run <id>', 'Specific run ID to compare')
  .option('-u, --url <url>', 'API server URL', 'http://localhost:3000')
  .action(compareCommand);

program
  .command('report')
  .description('Generate a report from a benchmark run')
  .option('-r, --run <id>', 'Run ID (default: latest)')
  .option('-f, --format <format>', 'Output format: json|csv|html', 'json')
  .option('-o, --output <path>', 'Output file path')
  .option('-u, --url <url>', 'API server URL', 'http://localhost:3000')
  .action(reportCommand);

program
  .command('create-suite')
  .description('Interactively create a test suite')
  .option('-o, --output <path>', 'Output file path', './my-suite.json')
  .action(createSuiteCommand);

program.parse();
