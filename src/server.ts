import { run } from 'probot';
import gitMedicApp from './index.js';

run(gitMedicApp).catch((error) => {
  console.error('Fatal error starting GitMedic server:', error);
  process.exit(1);
});
