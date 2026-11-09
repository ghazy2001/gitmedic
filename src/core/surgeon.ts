import { aiProvider } from '../llm/provider.js';
import type { CodePatch, DiagnosisReport, IssueContext, ReproductionTest } from '../types/index.js';
import type { GitSandbox } from '../git/sandbox.js';

export class SurgeonAgent {
  async cure(
    issue: IssueContext,
    diagnosis: DiagnosisReport,
    reproTest: ReproductionTest | undefined,
    sandbox: GitSandbox
  ): Promise<{ patches: CodePatch[]; testOutput: string; success: boolean }> {
    const patches: CodePatch[] = [];

    // Read the files that need surgery
    for (const filePath of diagnosis.affectedFiles) {
      if (!(await sandbox.fileExists(filePath))) continue;

      const originalContent = await sandbox.readFile(filePath);

      const systemPrompt = `You are GitMedic's Lead Surgeon 💊.
Your job is to apply a minimal, surgical code fix to resolve the bug cleanly without regressions.
Follow existing code style, formatting, and naming conventions.
Output strictly the FULL UPDATED file content with no markdown wrapping or explanations outside code.`;

      const userPrompt = `Issue #${issue.number}: ${issue.title}
Problem Analysis: ${diagnosis.rootCauseAnalysis}
Proposed Fix: ${diagnosis.proposedFixSummary}
Reproduction Strategy: ${diagnosis.reproductionStrategy}

Target File: ${filePath}
Current Code:
${originalContent}

Provide the complete updated file content that fixes the bug:`;

      const modifiedContent = await aiProvider.generateText([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { temperature: 0.1 });

      // Clean markdown code blocks if the model wrapped it
      const cleanedContent = modifiedContent
        .replace(/^```[a-zA-Z]*\n/, '')
        .replace(/\n```$/, '');

      await sandbox.writeFile(filePath, cleanedContent);

      patches.push({
        filePath,
        originalContent,
        modifiedContent: cleanedContent,
        explanation: `Surgical patch for ${filePath} to resolve issue #${issue.number}`
      });
    }

    // Run tests in sandbox to verify the cure
    let testOutput = '';
    let success = true;

    // Detect package runner
    if (await sandbox.fileExists('package.json')) {
      if (!(await sandbox.fileExists('node_modules'))) {
        await sandbox.runCommand('npm install --prefer-offline --no-audit --no-fund');
      }
      const testRun = await sandbox.runCommand('npm test --if-present');
      testOutput = testRun.stdout || testRun.stderr;
      success = testRun.exitCode === 0;
    } else if (await sandbox.fileExists('requirements.txt') || await sandbox.fileExists('pyproject.toml')) {
      const testRun = await sandbox.runCommand('pytest');
      testOutput = testRun.stdout || testRun.stderr;
      success = testRun.exitCode === 0;
    } else {
      testOutput = 'No standard test suite runner detected. Manual verification recommended.';
    }

    return { patches, testOutput, success };
  }
}
