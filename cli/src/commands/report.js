import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

export async function reportCommand(options) {
  const { run, format, output, url } = options;

  let runId = run;
  if (!runId) {
    try {
      const res = await axios.get(`${url}/api/runs`);
      const completed = res.data.filter(r => r.status === 'completed');
      if (completed.length === 0) {
        console.error(chalk.red('No completed runs found'));
        process.exit(1);
      }
      runId = completed[0].id;
    } catch {
      console.error(chalk.red('Could not fetch runs'));
      process.exit(1);
    }
  }

  try {
    const res = await axios.get(`${url}/api/runs/${runId}`);
    const { run: runData, results, metrics } = res.data;

    let content;
    const ext = format === 'csv' ? 'csv' : format === 'html' ? 'html' : 'json';
    const outPath = output || `./report-${runId.slice(0, 8)}.${ext}`;

    if (format === 'json') {
      content = JSON.stringify({ run: runData, metrics, results }, null, 2);
    } else if (format === 'csv') {
      const headers = 'model_name,avg_quality,avg_latency_ms,avg_cost_usd,consistency_score,tests_completed,tests_failed';
      const rows = metrics.map(m =>
        `${m.model_name},${m.avg_quality?.toFixed(2) || 0},${m.avg_latency_ms?.toFixed(0) || 0},${m.avg_cost_usd?.toFixed(6) || 0},${m.consistency_score?.toFixed(2) || 0},${m.tests_completed || 0},${m.tests_failed || 0}`
      );
      content = [headers, ...rows].join('\n');
    } else if (format === 'html') {
      content = generateHTML(runData, metrics);
    }

    fs.writeFileSync(path.resolve(outPath), content, 'utf-8');
    console.log(chalk.green(`\n✓ Report saved to: ${outPath}\n`));
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

function generateHTML(run, metrics) {
  const rows = metrics
    .sort((a, b) => (b.avg_quality || 0) - (a.avg_quality || 0))
    .map(m => `
      <tr>
        <td>${m.model_name}</td>
        <td>${(m.avg_quality || 0).toFixed(1)}/10</td>
        <td>${((m.avg_latency_ms || 0) / 1000).toFixed(2)}s</td>
        <td>$${(m.avg_cost_usd || 0).toFixed(5)}</td>
        <td>${(m.consistency_score || 0).toFixed(1)}</td>
        <td>${m.tests_completed}</td>
      </tr>
    `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>LLM Eval Bench Report — ${run.suite_name}</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #080B14; color: #F0F6FF; padding: 40px; }
    h1 { color: #6366F1; } h2 { color: #8B949E; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #161B22; padding: 12px; text-align: left; color: #8B949E; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #21262D; }
    tr:hover td { background: #161B22; }
  </style>
</head>
<body>
  <h1>LLM Eval Bench Report</h1>
  <h2>Suite: ${run.suite_name} | ${new Date(run.created_at).toLocaleString()}</h2>
  <table>
    <thead><tr><th>Model</th><th>Quality</th><th>Latency</th><th>Cost/call</th><th>Consistency</th><th>Tests Done</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
