import type { Context } from 'probot';
import { DiagnosticianAgent } from '../core/diagnostician.js';
import { ReproducerAgent } from '../core/reproducer.js';
import { SurgeonAgent } from '../core/surgeon.js';
import { MedicalReporter } from '../core/reporter.js';
import { GitSandbox } from '../git/sandbox.js';
import { config } from '../config/env.js';
import type { IssueContext } from '../types/index.js';

export async function handleIssueCure(
  context: Context<'issues.opened' | 'issue_comment.created'>,
  issueData: IssueContext
) {
  const { owner, repo } = context.repo();
  const diagnostician = new DiagnosticianAgent();
  const reproducer = new ReproducerAgent();
  const surgeon = new SurgeonAgent();
  const reporter = new MedicalReporter();

  // Acknowledge with an in-progress comment
  const acknowledgeComment = await context.octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueData.number,
    body: `🩺 **GitMedic is diagnosing Issue #${issueData.number}...**\n\n- [ ] Initializing sterile sandbox environment\n- [ ] Running root cause diagnosis\n- [ ] Synthesizing reproduction test\n- [ ] Applying surgical code patch\n\n*Hang tight, doctor is in surgery!*`
  });

  const commentId = acknowledgeComment.data.id;

  const updateProgress = async (step: 1 | 2 | 3 | 4) => {
    const s1 = step >= 1 ? '[x]' : '[ ]';
    const s2 = step >= 2 ? '[x]' : '[ ]';
    const s3 = step >= 3 ? '[x]' : '[ ]';
    const s4 = step >= 4 ? '[x]' : '[ ]';
    try {
      await context.octokit.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body: `🩺 **GitMedic is treating Issue #${issueData.number}...**\n\n- ${s1} Initializing sterile sandbox environment\n- ${s2} Running root cause diagnosis\n- ${s3} Synthesizing reproduction test\n- ${s4} Applying surgical code patch\n\n${step === 4 ? '🎉 *Surgery complete! Pull Request is being dispatched...*' : '*Hang tight, doctor is in surgery!*'}`
      });
    } catch {
      // Non-critical UI update
    }
  };

  let sandbox: GitSandbox | null = null;

  try {
    // 1. Get repository metadata & installation token
    const repoInfo = await context.octokit.repos.get({ owner, repo });
    const defaultBranch = repoInfo.data.default_branch;
    const cloneUrl = repoInfo.data.clone_url;

    // Get an installation access token to clone and push
    const auth = await context.octokit.auth({ type: 'installation' }) as { token: string };
    const token = auth.token;

    // 2. Spawn isolated sandbox
    sandbox = await GitSandbox.create(owner, repo, cloneUrl, defaultBranch, token);

    // 3. Create cure branch
    const branchName = await sandbox.createCureBranch(issueData.number, issueData.title);
    await updateProgress(1);

    // 4. Run Diagnosis
    const diagnosis = await diagnostician.diagnose(issueData, sandbox);
    await updateProgress(2);

    // 5. Generate Reproduction Test (TDD)
    const reproTest = await reproducer.writeReproductionTest(issueData, diagnosis, sandbox);
    await updateProgress(3);

    // 6. Apply Cure (Surgery)
    const surgery = await surgeon.cure(issueData, diagnosis, reproTest, sandbox);
    await updateProgress(4);

    // 7. Commit & Push
    const commitMsg = reporter.formatCommitMessage(issueData);
    await sandbox.commitAndPush(branchName, commitMsg, token, cloneUrl);

    // 8. Open Pull Request
    const prBody = reporter.formatPullRequestBody(issueData, {
      success: surgery.success,
      diagnosis,
      reproductionTest: reproTest,
      patches: surgery.patches,
      testOutput: surgery.testOutput,
    });

    const pr = await context.octokit.pulls.create({
      owner,
      repo,
      title: `🩺 GitMedic: Fix issue #${issueData.number} - ${issueData.title.slice(0, 50)}`,
      head: branchName,
      base: defaultBranch,
      body: prBody
    });

    // 9. Update issue with success link
    await context.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueData.number,
      body: `✅ **Treatment Complete!** GitMedic has opened a verified pull request: **#${pr.data.number}**\n\n👉 Review the cure here: ${pr.data.html_url}`
    });

  } catch (error: any) {
    console.error(`[GitMedic] Failed to cure issue #${issueData.number}:`, error);
    await context.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueData.number,
      body: `⚠️ **GitMedic Diagnosis Warning:** An error occurred during automated surgery:\n\`\`\`\n${error?.message || error}\n\`\`\`\nManual intervention required.`
    });
  } finally {
    if (sandbox) {
      await sandbox.cleanup();
    }
  }
}
