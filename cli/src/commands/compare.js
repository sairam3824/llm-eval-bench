import chalk from 'chalk';
import axios from 'axios';

export async function compareCommand(options) {
  const { models, run, url } = options;

  let runId = run;

  if (!runId) {
    // Get the latest completed run
    try {
      const res = await axios.get(`${url}/api/runs`);
      const completed = res.data.filter(r => r.status === 'completed');
      if (completed.length === 0) {
        console.error(chalk.red('No completed benchmark runs found'));
        process.exit(1);
      }
      runId = completed[0].id;
      console.log(chalk.gray(`Using latest run: ${runId}`));
    } catch {
      console.error(chalk.red('Could not fetch runs. Is the server running?'));
      process.exit(1);
    }
  }

  try {
    const res = await axios.get(`${url}/api/runs/${runId}`);
    const { run: runData, metrics } = res.data;

    let filteredMetrics = metrics;
    if (models) {
      const modelFilter = models.split(',').map(m => m.trim().toLowerCase());
      filteredMetrics = metrics.filter(m =>
        modelFilter.some(f => m.model_name.toLowerCase().includes(f))
      );
    }

    if (filteredMetrics.length === 0) {
      console.error(chalk.red('No matching models found in this run'));
      process.exit(1);
    }

    console.log(chalk.hex('#6366F1')(`\n📊 Comparison: ${runData.suite_name}\n`));
    console.log(chalk.gray(`Run ID: ${runId}\n`));

    // Header
    console.log(chalk.bold(
      'Model'.padEnd(26) +
      'Quality'.padEnd(12) +
      'Latency'.padEnd(12) +
      'Cost/call'.padEnd(12) +
      'Consistency'
    ));
    console.log(chalk.gray('─'.repeat(72)));

    const sorted = [...filteredMetrics].sort((a, b) => (b.avg_quality || 0) - (a.avg_quality || 0));
    sorted.forEach((m, i) => {
      const quality = (m.avg_quality || 0).toFixed(1);
      const latency = ((m.avg_latency_ms || 0) / 1000).toFixed(2) + 's';
      const cost = '$' + (m.avg_cost_usd || 0).toFixed(5);
      const consistency = (m.consistency_score || 0).toFixed(1);

      const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
      const color = colors[i % colors.length];

      const mark = i === 0 ? chalk.yellow(' ★') : '';

      console.log(
        chalk.hex(color)(m.model_name.padEnd(26)) +
        chalk.white(quality.padEnd(12)) +
        chalk.gray(latency.padEnd(12)) +
        chalk.gray(cost.padEnd(12)) +
        chalk.gray(consistency) +
        mark
      );
    });

    console.log(chalk.gray('─'.repeat(72)));
    console.log(chalk.gray(`\n  Full comparison: ${url}/compare?run=${runId}\n`));
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}
