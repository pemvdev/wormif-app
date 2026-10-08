import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseId = '019db345-a173-7000-8161-d7633937a443';

function runSql(file, { ignoreError = false } = {}) {
  const relativeFile = path.relative(root, file).replaceAll('\\', '/');
  const args = ['wrangler', 'd1', 'execute', databaseId, '--local', `--file=./${relativeFile}`];
  if (process.env.WORMIF_TEST_STATE_PATH) args.push('--persist-to', process.env.WORMIF_TEST_STATE_PATH);

  try {
    execFileSync('npx', args, { cwd: root, stdio: 'inherit' });
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
runSql(path.join(root, 'database/migrations/d1/0004_add_usuario_profile_fields.sql'), {
  ignoreError: true
});
runSql(path.join(root, 'database/migrations/d1/0005_add_diagnostico_image.sql'), {
  ignoreError: true
});
runSql(path.join(root, 'database/migrations/d1/0006_create_palpites.sql'));
runSql(path.join(root, 'database/migrations/d1/0007_create_discussao_analises.sql'));
if (process.argv.includes('--seed')) {
  runSql(path.join(root, 'database/seeds/d1/usuario-test-data.sql'));
  runSql(path.join(root, 'database/seeds/d1/diagnostico-test-data.sql'));
}
