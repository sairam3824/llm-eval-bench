import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';

export async function runCommand(options) {
  const { suite, models, judge, url } = options;

  if (!suite) {
    console.error(chalk.red('Error: --suite <path> is required'));
    process.exit(1);
  }

  // Load suite
  const suitePath = path.resolve(suite);
  if (!fs.existsSync(suitePath)) {
    console.error(chalk.red(`Suite file not found: ${suitePath}`));
    process.exit(1);
  }

  let suiteData;
  try {
    suiteData = JSON.parse(fs.readFileSync(suitePath, 'utf-8'));
  } catch {
    console.error(chalk.red('Failed to parse suite JSON'));
    process.exit(1);
  }

  // Get model IDs
  let modelIds = [];
  if (models) {
    modelIds = models.split(',').map(m => m.trim());
  } else {
    // Fetch all enabled models
    const spinner = ora('Fetching available models...').start();
    try {
      const res = await axios.get(`${url}/api/models`);
      const enabledModels = res.data.filter(m => m.enabled);
      modelIds = enabledModels.map(m => m.id);
      spinner.succeed(`Found ${enabledModels.length} enabled models`);
    } catch {
      spinner.fail('Could not fetch models. Is the server running?');
      process.exit(1);
    }
  }

  if (modelIds.length === 0) {
    console.error(chalk.red('No models selected'));
    process.exit(1);
  }

  console.log(chalk.hex('#6366F1')(`\n📋 Suite: ${suiteData.name}`));
  console.log(chalk.gray(`   Tests: ${suiteData.tests.length}`));
  console.log(chalk.gray(`   Models: ${modelIds.join(', ')}`));
  console.log(chalk.gray(`   Judge: ${judge}\n`));

  const spinner = ora('Launching benchmark...').start();

  let runId;
  try {
    const res = await axios.post(`${url}/api/benchmark`, {
      suiteName: suiteData.name,
      tests: suiteData.tests,
      modelIds,
      judgeModel: judge,
    });
    runId = res.data.runId;
    spinner.succeed(`Benchmark started! Run ID: ${chalk.cyan(runId)}`);
  } catch (err) {
    spinner.fail(`Failed to start benchmark: ${err.message}`);
    process.exit(1);
  }

  // Poll for completion
  const progressSpinner = ora('Running benchmark (this may take several minutes)...').start();
  let completed = false;

  while (!completed) {
    await new Promise(r => setTimeout(r, 5000));
    try {
      const res = await axios.get(`${url}/api/runs/${runId}/status`);
      const { status, progress } = res.data;

      progressSpinner.text = `Running... ${progress.completed}/${progress.total} results (${status})`;

      if (status === 'completed') {
        progressSpinner.succeed('Benchmark completed!');
        completed = true;
      } else if (status === 'failed') {
        progressSpinner.fail('Benchmark failed');
        process.exit(1);
      }
    } catch {
      // Continue polling
    }
  }

  // Fetch and display results
  try {
    const res = await axios.get(`${url}/api/runs/${runId}`);
    const { metrics } = res.data;

    console.log(chalk.hex('#6366F1')('\n📊 Results Summary\n'));
    console.log(chalk.gray('─'.repeat(70)));

    const sorted = [...metrics].sort((a, b) => (b.avg_quality || 0) - (a.avg_quality || 0));
    for (const m of sorted) {
      const quality = (m.avg_quality || 0).toFixed(1);
      const latency = ((m.avg_latency_ms || 0) / 1000).toFixed(2);
      const cost = (m.avg_cost_usd || 0).toFixed(5);
      const bar = '█'.repeat(Math.floor(m.avg_quality || 0));

      console.log(`  ${chalk.bold(m.model_name.padEnd(25))} ${chalk.hex('#6366F1')(bar.padEnd(10))} ${chalk.white(quality)}/10  ${chalk.gray(latency + 's')}  ${chalk.gray('$' + cost)}`);
    }
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.gray(`\n  View full results: ${url}/results/${runId}\n`));
  } catch (err) {
    console.error(chalk.red('Could not fetch results'));
  }
}
