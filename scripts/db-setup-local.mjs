import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseId = '019db345-a173-7000-8161-d7633937a443';

function runSql(file, { ignoreError = false } = {}) {
  const relativeFile = path.relative(root, file).replaceAll('\\', '/');
  const command = `npx wrangler d1 execute ${databaseId} --local --file=./${relativeFile}`;

  try {
    execSync(command, { cwd: root, stdio: 'inherit' });
  } catch (error) {
    if (!ignoreError) {
      throw error;
    }
  }
}

runSql(path.join(root, 'database/migrations/d1/0001_create_diagnosticos.sql'));
runSql(path.join(root, 'database/migrations/d1/0002_create_usuarios.sql'));
runSql(path.join(root, 'database/migrations/d1/0003_add_diagnostico_user_id.sql'), {
  ignoreError: true
});
if (process.argv.includes('--seed')) {
  runSql(path.join(root, 'database/seeds/d1/usuario-test-data.sql'));
  runSql(path.join(root, 'database/seeds/d1/diagnostico-test-data.sql'));
}
