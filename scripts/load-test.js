import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';
const RESULTS_DIR = 'load-test-results';

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

// Test configurations
const eventCounts = [100000, 300000, 500000, 700000, 900000];
const concurrencyLevels = [200, 600, 1000, 1400, 1800];

// Sample event data
const sampleEvents = [
  {
    actor_id: 'user_1',
    verb: 'like',
    object_type: 'post',
    object_id: 'post_123',
    target_user_ids: ['user_2', 'user_3'],
    actor_name: 'John Doe',
    object_title: 'Amazing sunset photo'
  },
  {
    actor_id: 'user_2',
    verb: 'comment',
    object_type: 'photo',
    object_id: 'photo_456',
    target_user_ids: ['user_1'],
    actor_name: 'Jane Smith',
    object_title: 'Beach vacation'
  },
  {
    actor_id: 'user_3',
    verb: 'follow',
    object_type: 'user',
    object_id: 'user_4',
    target_user_ids: ['user_4'],
    actor_name: 'Bob Johnson',
    object_title: 'Alice Brown'
  }
];

// Generate random event
function generateRandomEvent() {
  const base = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
  return {
    ...base,
    object_id: `${base.object_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    actor_id: `user_${Math.floor(Math.random() * 100) + 1}`
  };
}

// Seed database with events
async function seedDatabase(eventCount) {
  console.log(`Seeding database with ${eventCount} events...`);

  const batchSize = 1000;
  const batches = Math.ceil(eventCount / batchSize);

  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, eventCount - (i * batchSize));
    const promises = [];

    for (let j = 0; j < currentBatchSize; j++) {
      const event = generateRandomEvent();
      promises.push(
        fetch(`${API_BASE}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user_id': event.actor_id
          },
          body: JSON.stringify(event)
        })
      );
    }

    await Promise.all(promises);
    console.log(`Seeded batch ${i + 1}/${batches} (${(i + 1) * batchSize} events)`);
  }

  console.log(`Database seeded with ${eventCount} events`);
}

// Run load test for specific endpoint
async function runLoadTest(endpoint, concurrency, duration = 30) {
  console.log(`Running load test: ${endpoint} with ${concurrency} concurrent connections`);

  const options = {
    url: `${API_BASE}${endpoint}`,
    connections: concurrency,
    duration: duration,
    headers: {
      'user_id': 'user_1'
    }
  };

  // Add request body for POST endpoints
  if (endpoint === '/events') {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(generateRandomEvent());
  }

  return new Promise((resolve, reject) => {
    const instance = autocannon(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    // Track progress
    instance.on('response', () => {
      process.stdout.write('.');
    });
  });
}

// Format results for reporting
function formatResults(results, endpoint, eventCount, concurrency) {
  return {
    endpoint,
    eventCount,
    concurrency,
    requestsPerSecond: results.requests.average,
    latency: {
      min: results.latency.min,
      mean: results.latency.mean,
      median: results.latency.p50,
      max: results.latency.max,
      p95: results.latency.p95,
      p99: results.latency.p99
    },
    throughput: results.throughput.average,
    errors: results.errors,
    timeouts: results.timeouts,
    duration: results.duration,
    timestamp: new Date().toISOString()
  };
}

// Main test runner
async function runAllTests() {
  const endpoints = [
    '/events',
    '/feed?user_id=user_1&limit=20',
    '/notifications?user_id=user_1&limit=50',
    '/top?window=1h&type=objects&limit=100'
  ];

  const allResults = [];

  for (const eventCount of eventCounts) {
    console.log(`\n=== Testing with ${eventCount} events ===`);

    // Seed database
    await seedDatabase(eventCount);

    // Wait for indexing
    console.log('Waiting 10 seconds for database indexing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    for (const endpoint of endpoints) {
      console.log(`\nTesting endpoint: ${endpoint}`);

      for (const concurrency of concurrencyLevels) {
        try {
          const result = await runLoadTest(endpoint, concurrency);
          const formattedResult = formatResults(result, endpoint, eventCount, concurrency);
          allResults.push(formattedResult);

          console.log(`\n${concurrency} concurrent: ${formattedResult.requestsPerSecond.toFixed(2)} req/s, ${formattedResult.latency.mean.toFixed(2)}ms avg latency`);

          // Brief pause between tests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error testing ${endpoint} with ${concurrency} concurrency:`, error.message);
        }
      }
    }
  }

  // Save results
  const resultsFile = path.join(RESULTS_DIR, `load-test-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));

  // Generate report
  generateReport(allResults);

  console.log(`\nLoad testing complete! Results saved to ${resultsFile}`);
}

// Generate HTML report
function generateReport(results) {
  const reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Activity Feed Load Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .chart-container { width: 800px; height: 400px; margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Activity Feed Load Test Report</h1>
    <div class="summary">
        <h2>Test Summary</h2>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Total Tests:</strong> ${results.length}</p>
        <p><strong>Event Counts:</strong> ${eventCounts.join(', ')}</p>
        <p><strong>Concurrency Levels:</strong> ${concurrencyLevels.join(', ')}</p>
    </div>

    <h2>Performance Charts</h2>
    <div class="chart-container">
        <canvas id="throughputChart"></canvas>
    </div>
    <div class="chart-container">
        <canvas id="latencyChart"></canvas>
    </div>

    <h2>Detailed Results</h2>
    <table>
        <thead>
            <tr>
                <th>Endpoint</th>
                <th>Events</th>
                <th>Concurrency</th>
                <th>Req/sec</th>
                <th>Avg Latency (ms)</th>
                <th>P95 Latency (ms)</th>
                <th>Errors</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(r => `
                <tr>
                    <td>${r.endpoint}</td>
                    <td>${r.eventCount.toLocaleString()}</td>
                    <td>${r.concurrency}</td>
                    <td>${r.requestsPerSecond.toFixed(2)}</td>
                    <td>${r.latency.mean.toFixed(2)}</td>
                    <td>${r.latency.p95.toFixed(2)}</td>
                    <td>${r.errors}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <script>
        const results = ${JSON.stringify(results)};
        
        // Throughput chart
        const throughputCtx = document.getElementById('throughputChart').getContext('2d');
        new Chart(throughputCtx, {
            type: 'line',
            data: {
                labels: [${concurrencyLevels.map(c => `'${c}'`).join(', ')}],
                datasets: [
                    ${endpoints.map((endpoint, i) => `{
                        label: '${endpoint}',
                        data: [${concurrencyLevels.map(c => {
    const result = results.find(r => r.endpoint === endpoint && r.concurrency === c && r.eventCount === eventCounts[eventCounts.length - 1]);
    return result ? result.requestsPerSecond.toFixed(2) : 0;
  }).join(', ')}],
                        borderColor: 'hsl(${i * 60}, 70%, 50%)',
                        fill: false
                    }`).join(', ')}
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Throughput vs Concurrency (${eventCounts[eventCounts.length - 1]} events)' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Requests/sec' } },
                    x: { title: { display: true, text: 'Concurrency' } }
                }
            }
        });

        // Latency chart
        const latencyCtx = document.getElementById('latencyChart').getContext('2d');
        new Chart(latencyCtx, {
            type: 'line',
            data: {
                labels: [${concurrencyLevels.map(c => `'${c}'`).join(', ')}],
                datasets: [
                    ${endpoints.map((endpoint, i) => `{
                        label: '${endpoint}',
                        data: [${concurrencyLevels.map(c => {
    const result = results.find(r => r.endpoint === endpoint && r.concurrency === c && r.eventCount === eventCounts[eventCounts.length - 1]);
    return result ? result.latency.mean.toFixed(2) : 0;
  }).join(', ')}],
                        borderColor: 'hsl(${i * 60}, 70%, 50%)',
                        fill: false
                    }`).join(', ')}
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Average Latency vs Concurrency (${eventCounts[eventCounts.length - 1]} events)' }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Latency (ms)' } },
                    x: { title: { display: true, text: 'Concurrency' } }
                }
            }
        });
    </script>
</body>
</html>`;

  const reportFile = path.join(RESULTS_DIR, `load-test-report-${Date.now()}.html`);
  fs.writeFileSync(reportFile, reportHtml);
  console.log(`HTML report generated: ${reportFile}`);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
    if (response.ok) {
      console.log('Server is running');
      return true;
    }
  } catch (error) {
    console.error('Server is not running. Please start the server first.');
    return false;
  }
}

// Run tests
async function main() {
  console.log('Activity Feed Load Testing Tool');
  console.log('================================');

  if (!(await checkServer())) {
    process.exit(1);
  }

  await runAllTests();
}

main().catch(console.error);