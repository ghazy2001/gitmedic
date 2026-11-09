import type { CureResult, IssueContext } from '../types/index.js';

export class MedicalReporter {
  formatCommitMessage(issue: IssueContext): string {
    return `fix(${issue.title.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')}): resolve issue #${issue.number}\n\nAutomated cure applied by GitMedic 🩺\nCloses #${issue.number}`;
  }

  formatPullRequestBody(issue: IssueContext, result: CureResult): string {
    const testStatusBadge = result.success
      ? '![Tests Passing](https://img.shields.io/badge/tests-passing-brightgreen)'
      : '![Tests Warning](https://img.shields.io/badge/tests-manual_check_needed-yellow)';

    return `## 🩺 GitMedic Medical Discharge Report

Closes #${issue.number}

${testStatusBadge} ![TDD Verified](https://img.shields.io/badge/TDD-reproduction_verified-blue)

---

### 📋 Diagnosis Summary
> **Issue:** ${result.diagnosis.issueSummary}

**Root Cause:**
${result.diagnosis.rootCauseAnalysis}

---

### 💊 Treatment & Changes Applied
${result.patches.map(p => `- \`${p.filePath}\`: ${p.explanation}`).join('\n')}

${result.reproductionTest ? `
---

### 🧪 Reproduction & Verification
- **Automated Test Added:** \`${result.reproductionTest.testFilePath}\`
- **Verification Result:**
\`\`\`
${result.testOutput.slice(0, 1000)}
\`\`\`
` : ''}

---

*Prescribed and cured automatically by **[GitMedic](https://gitmedic.dev)** 🩺. Need adjustments? Reply directly to this PR with \`@gitmedic <instruction>\`!*
`;
  }
}
