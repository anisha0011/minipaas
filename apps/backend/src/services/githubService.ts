import axios from 'axios';

export async function triggerDeploymentWorkflow(params: {
  deploymentId: string;
  applicationId: string;
  repositoryUrl: string;
  branch: string;
}) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    console.error('GitHub configuration (token, owner, repo) is missing on the backend.');
    throw new Error('GitHub configuration missing');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`;

  try {
    console.log(`Dispatching GitHub workflow for deployment ${params.deploymentId} on repo ${owner}/${repo}...`);
    const response = await axios.post(
      url,
      {
        ref: 'main',
        inputs: {
          deploymentId: params.deploymentId,
          applicationId: params.applicationId,
          repositoryUrl: params.repositoryUrl,
          branch: params.branch,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    console.log('GitHub workflow dispatched successfully:', response.status);
  } catch (error: any) {
    console.error('Failed to trigger GitHub workflow via API:', error.response?.data || error.message);
    throw error;
  }
}
