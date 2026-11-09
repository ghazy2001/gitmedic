import { aiProvider } from '../llm/provider.js';
import type { DiagnosisReport, IssueContext, ReproductionTest } from '../types/index.js';
import type { GitSandbox } from '../git/sandbox.js';

export class ReproducerAgent {
  async writeReproductionTest(
    issue: IssueContext,
    diagnosis: DiagnosisReport,
    sandbox: GitSandbox
  ): Promise<ReproductionTest | undefined> {
    // Read the contents of the primary affected files
    const fileSnippets: Record<string, string> = {};
    for (const filePath of diagnosis.affectedFiles.slice(0, 3)) {
      if (await sandbox.fileExists(filePath)) {
        fileSnippets[filePath] = await sandbox.readFile(filePath);
      }
    }

    const systemPrompt = `You are GitMedic's Lab Scientist 🧪.
Your task is to write an automated test that REPRODUCES the exact bug described in the issue.
The test must FAIL initially before the bug is fixed, and PASS once fixed.

Determine the repository's test framework (e.g. vitest, jest, pytest).
Output strictly valid JSON:
{
  "testFilePath": "tests/reproduce_issue_${issue.number}.test.ts",
  "testFileContent": "full source code of the reproduction test",
  "testFramework": "vitest"
}`;

    const userPrompt = `Issue:
Title: ${issue.title}
Body: ${issue.body}

Diagnosis:
${JSON.stringify(diagnosis, null, 2)}

Affected Code Files:
${Object.entries(fileSnippets).map(([p, c]) => `--- File: ${p} ---\n${c.slice(0, 4000)}`).join('\n\n')}

Write a clean reproduction test verifying this bug.`;

    try {
      const testPlan = await aiProvider.generateJSON<ReproductionTest>([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], { temperature: 0.1 });

      // Write the test to disk in the sandbox
      await sandbox.writeFile(testPlan.testFilePath, testPlan.testFileContent);
      return testPlan;
    } catch (err) {
      console.warn(`[GitMedic] Could not generate isolated reproduction test: ${err}`);
      return undefined;
    }
  }
}
