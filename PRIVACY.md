# Privacy Policy for GitMedic

*Last updated: November 9, 2026*

GitMedic ("we", "our", or "us") provides an autonomous AI-driven development agent designed to diagnose, reproduce, and resolve repository issues. We take user privacy and security seriously.

---

## 1. Information We Collect
- **GitHub App Permissions & Webhooks:** When you install GitMedic on a repository, we receive webhook notifications relating to issues and pull requests (e.g. issue titles, descriptions, and comments mentioning `@gitmedic`).
- **Temporary Code Access:** To diagnose and patch issues, GitMedic performs shallow, temporary clones of the designated repository in sterile, ephemeral sandboxes.
- **No Long-term Code Storage:** Source code is used strictly during the active triage and surgery lifecycle. Sandbox environments are immediately and irreversibly purged from memory and disk upon completion or failure of a cure task.

---

## 2. How Information is Used
- To diagnose the root causes of reported bugs.
- To generate automated reproduction tests and surgical code patches.
- To open Pull Requests with diagnostic reports on your repository.
- We do **NOT** use your proprietary source code to train AI foundation models.

---

## 3. Data Retention & Security
- GitMedic operates in isolated, transient environments.
- API keys, credentials, and access tokens are ephemeral installation tokens granted via GitHub Apps protocol with minimum necessary permissions.
- Customer code is never shared with third parties except the LLM processing provider (Google Cloud / Anthropic / OpenAI enterprise API endpoints with zero data retention policies).

---

## 4. Contact Us
For questions regarding this privacy policy or data inquiries, please open an issue at:
`https://github.com/ghazy2001/gitmedic/issues`
or contact: `mahmoudghazy2001@gmail.com`.
