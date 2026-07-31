/**
 * PRCommentPoster.ts (T050)
 * Single responsibility: Posting batched failure analysis reports to GitHub PR comments using Octokit.
 */
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

export class PRCommentPoster {
  public static async postComment(): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    const prNumber = process.env.PR_NUMBER;
    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];

    if (!token || !prNumber || !repoOwner || !repoName) {
      console.log('[PRCommentPoster] Missing required GitHub env vars (GITHUB_TOKEN, PR_NUMBER, GITHUB_REPOSITORY). Skipping PR comment.');
      return;
    }

    const analysisDir = path.resolve(process.cwd(), 'failure-analysis');
    if (!fs.existsSync(analysisDir)) return;

    const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) return;

    let body = `## 🤖 QA Forge AI Failure Analysis\n\n`;
    body += `Detected **${files.length}** test failure(s) in this run:\n\n`;

    for (const file of files) {
      const content = fs.readFileSync(path.join(analysisDir, file), 'utf-8');
      const analysis = JSON.parse(content);
      body += `### ❌ Test Failure: \`${file.replace('.json', '')}\`\n`;
      body += `- **Root Cause**: ${analysis.rootCause}\n`;
      body += `- **Category**: \`${analysis.category}\` (Confidence: ${Math.round(analysis.confidence * 100)}%)\n`;
      body += `- **Is Flaky**: ${analysis.isFlaky ? '⚠️ Yes' : 'No'}\n`;
      body += `- **Suggested Fix**: ${analysis.suggestedFix.description}\n`;
      if (analysis.suggestedFix.codeDiff) {
        body += `\`\`\`diff\n${analysis.suggestedFix.codeDiff}\n\`\`\`\n`;
      }
      body += `\n---\n`;
    }

    const octokit = new Octokit({ auth: token });
    await octokit.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: parseInt(prNumber, 10),
      body,
    });

    console.log('[PRCommentPoster] PR comment successfully posted.');
  }
}
