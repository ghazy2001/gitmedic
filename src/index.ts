import type { Probot } from 'probot';
import { handleIssueCure } from './handlers/issueHandler.js';
import { config } from './config/env.js';

export default function gitMedicApp(app: Probot) {
  app.log.info('🩺 GitMedic AI Bot is online and listening for issues!');

  // Trigger when a comment mentions @gitmedic fix or @gitmedic cure
  app.on('issue_comment.created', async (context) => {
    const commentBody = context.payload.comment.body.trim().toLowerCase();
    const trigger = config.BOT_TRIGGER_COMMAND.toLowerCase();

    if (!commentBody.includes(trigger)) {
      return;
    }

    // Ignore comments made by bots to avoid infinite loops
    if (context.payload.comment.user.type === 'Bot') {
      return;
    }

    const issue = context.payload.issue;
    app.log.info(`🩺 GitMedic trigger received on Issue #${issue.number} by @${context.payload.comment.user.login}`);

    await handleIssueCure(context, {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      author: issue.user.login,
      labels: (issue.labels || []).map((l: any) => l.name)
    });
  });

  // Automatically trigger on issues that match auto-cure labels
  app.on('issues.opened', async (context) => {
    const issue = context.payload.issue;
    const autoLabels = config.AUTO_CURE_LABELS.split(',').map(l => l.trim().toLowerCase());
    const issueLabels = (issue.labels || []).map((l: any) => l.name.toLowerCase());

    const hasMatchingLabel = issueLabels.some((l: string) => autoLabels.includes(l));
    if (!hasMatchingLabel) {
      return;
    }

    app.log.info(`🩺 GitMedic auto-curing Issue #${issue.number} due to matching label`);

    await handleIssueCure(context, {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      author: issue.user.login,
      labels: (issue.labels || []).map((l: any) => l.name)
    });
  });
}
