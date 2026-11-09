import { aiProvider } from '../llm/provider.js';
import type { DiagnosisReport, IssueContext } from '../types/index.js';
import type { GitSandbox } from '../git/sandbox.js';

export class DiagnosticianAgent {
  async diagnose(issue: IssueContext, sandbox: GitSandbox): Promise<DiagnosisReport> {
    const allFiles = await sandbox.listFiles();
    
    // Narrow candidate files (filter out images, locks, dist, etc.)
    const codeFiles = allFiles.filter(f => 
      !f.includes('node_modules') && 
      !f.includes('dist') && 
      !f.includes('.lock') &&
      /\.(ts|tsx|js|jsx|py|go|rs|rb|json|md)$/.test(f)
    ).slice(0, 500);

    const systemPrompt = `You are GitMedic's Chief Diagnostician 🩺.
Your job is to analyze a reported GitHub issue, inspect the repository structure, and diagnose the exact root cause.

Output strictly valid JSON with the following structure:
{
  "issueSummary": "Brief 1-2 sentence description of the bug",
  "rootCauseAnalysis": "Detailed technical analysis of what is breaking and why",
  "affectedFiles": ["relative/path/to/file1.ts", "relative/path/to/file2.ts"],
  "reproductionStrategy": "Step-by-step logic on how to reproduce this bug with an automated unit test",
  "proposedFixSummary": "High-level description of the code cure needed"
}`;

    const userPrompt = `GitHub Issue #${issue.number}:
Title: ${issue.title}
Author: @${issue.author}
Labels: ${issue.labels.join(', ')}

Description:
${issue.body}

Repository Code Files:
${codeFiles.join('\n')}

Diagnose the root cause and identify the most likely affected files.`;

    const diagnosis = await aiProvider.generateJSON<DiagnosisReport>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.1 });

    return diagnosis;
  }
}
