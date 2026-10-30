const BASE_URL = 'http://localhost:5000';
const uniqueSlug = `minipaas-phase2-${Date.now()}`;

async function runTests() {
  console.log('--- Starting Integration Tests against Live Container ---');

  // 1. Create Application
  const appRes = await fetch(`${BASE_URL}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'MiniPaaS Phase2 Verification',
      slug: uniqueSlug,
      description: 'Test application for Phase 2 verification',
      repositoryUrl: 'https://github.com/example/test',
      branch: 'main'
    })
  });
  if (!appRes.ok) throw new Error(`Failed to create application: ${await appRes.text()}`);
  const app = await appRes.json();
  const appId = app._id;
  console.log('✔ Application Created:', appId);

  // 2. Retrieve Application by ID
  const getAppRes = await fetch(`${BASE_URL}/api/applications/${appId}`);
  if (!getAppRes.ok) throw new Error('Failed to retrieve application');
  const fetchedApp = await getAppRes.json();
  if (fetchedApp.slug !== uniqueSlug) throw new Error('Application slug mismatch');
  console.log('✔ Application Retrieved successfully');

  // 3. List Applications
  const listAppRes = await fetch(`${BASE_URL}/api/applications`);
  const apps = await listAppRes.json();
  if (!apps.some((a: any) => a._id === appId)) throw new Error('Created app not found in list');
  console.log('✔ Application found in list');

  // 4. Update Metadata
  const updateRes = await fetch(`${BASE_URL}/api/applications/${appId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Updated Description' })
  });
  const updatedApp = await updateRes.json();
  if (updatedApp.description !== 'Updated Description') throw new Error('Metadata update failed');
  console.log('✔ Application Metadata Updated successfully');

  // 5. Create Deployment Record
  const depRes = await fetch(`${BASE_URL}/api/applications/${appId}/deployments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'queued' })
  });
  const dep = await depRes.json();
  if (dep.status !== 'queued') throw new Error('Initial deployment status is not queued');
  const depId = dep._id;
  console.log('✔ Deployment Created:', depId);

  // 6. Add Test Deployment Logs
  await fetch(`${BASE_URL}/api/internal/deployments/${depId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'info', message: 'Log 1: Queued' })
  });
  await fetch(`${BASE_URL}/api/internal/deployments/${depId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'info', message: 'Log 2: Building' })
  });

  const logsRes = await fetch(`${BASE_URL}/api/deployments/${depId}/logs`);
  const logs = await logsRes.json();
  if (logs.length !== 2 || logs[0].message !== 'Log 1: Queued') throw new Error('Logs retrieval or order failed');
  console.log('✔ Deployment Logs Retrieved in correct order');

  // 7. Negative / Validation Tests
  const invalidIdRes = await fetch(`${BASE_URL}/api/applications/invalid-id`);
  if (invalidIdRes.status !== 400) throw new Error('Failed to reject invalid ObjectId');

  const missingRes = await fetch(`${BASE_URL}/api/applications/60c72b2f9b1d8b2b8c8b4567`);
  if (missingRes.status !== 404) throw new Error('Failed to return 404 for missing application');
  console.log('✔ Validation & Error handling tests passed');

  // 8. Test History Preservation Rules on Deletion
  const deleteFailRes = await fetch(`${BASE_URL}/api/applications/${appId}`, { method: 'DELETE' });
  if (deleteFailRes.status !== 409) throw new Error('Should prevent application deletion when deployments exist');
  console.log('✔ Application Deletion safely prevented due to existing deployments');

  // 9. Cleanup
  console.log('9. Cleaning up test records...');
  await fetch(`${BASE_URL}/api/internal/test/cleanup/${appId}`, { method: 'DELETE' });
  console.log('✔ Cleanup complete');

  console.log('--- Integration Tests Passed Successfully ---');
}

runTests().catch(err => {
  console.error('❌ Integration Test Failed:', err);
  process.exit(1);
});
