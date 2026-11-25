import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseId = '019db345-a173-7000-8161-d7633937a443';
const wranglerCli = path.join(root, 'node_modules/wrangler/bin/wrangler.js');

function runCommand(args, { ignoreDuplicateColumn = false } = {}) {
  try {
    const output = execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    process.stdout.write(output);
  } catch (error) {
    const stdout = error.stdout?.toString() ?? '';
    const stderr = error.stderr?.toString() ?? '';
    if (ignoreDuplicateColumn && /duplicate column name:/i.test(`${stdout}\n${stderr}`)) {
      return;
    }

    process.stdout.write(stdout);
    process.stderr.write(stderr);
    throw error;
  }
}

function runSql(file, { ignoreDuplicateColumn = false } = {}) {
  const relativeFile = path.relative(root, file).replaceAll('\\', '/');
  const baseArgs = [wranglerCli, 'd1', 'execute', databaseId, '--local'];
  if (process.env.WORMIF_TEST_STATE_PATH) {
    baseArgs.push('--persist-to', process.env.WORMIF_TEST_STATE_PATH);
  }

  if (ignoreDuplicateColumn) {
    const statements = readFileSync(file, 'utf8')
      .split(';')
      .map((statement) => statement.replace(/^\s*--.*$/gm, '').trim())
      .filter(Boolean);

    for (const statement of statements) {
      runCommand([...baseArgs, '--command', statement], { ignoreDuplicateColumn: true });
    }
    return;
  }

  runCommand([...baseArgs, `--file=./${relativeFile}`]);
}

runSql(path.join(root, 'database/migrations/d1/0001_create_diagnosticos.sql'));
runSql(path.join(root, 'database/migrations/d1/0002_create_usuarios.sql'));
runSql(path.join(root, 'database/migrations/d1/0003_add_diagnostico_user_id.sql'), {
  ignoreDuplicateColumn: true
});
runSql(path.join(root, 'database/migrations/d1/0004_add_usuario_profile_fields.sql'), {
  ignoreDuplicateColumn: true
});
runSql(path.join(root, 'database/migrations/d1/0005_add_diagnostico_image.sql'), {
  ignoreDuplicateColumn: true
});
runSql(path.join(root, 'database/migrations/d1/0006_create_palpites.sql'));
runSql(path.join(root, 'database/migrations/d1/0007_create_discussao_analises.sql'));
runSql(path.join(root, 'database/migrations/d1/0008_add_geolocalizacao.sql'), {
  ignoreDuplicateColumn: true
});
if (process.argv.includes('--seed')) {
  runSql(path.join(root, 'database/seeds/d1/usuario-test-data.sql'));
  runSql(path.join(root, 'database/seeds/d1/diagnostico-test-data.sql'));
}
