import test from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { scaffoldProgram } from '../mcp-server/tools/scaffold.js';

const TEST_DIR = '/tmp/scaffold-test';

test('scaffold_program creates valid Anchor project structure', async (t) => {
  // Clean up before test
  try {
    await fs.rm(path.join(TEST_DIR, 'test-program'), { recursive: true });
  } catch (e) {
    // ignore if not exists
  }

  await t.test('with default options', async () => {
    const result = await scaffoldProgram({
      programName: 'test-program'
    });

    assert.strictEqual(result.success, true);
    assert.match(result.projectPath, /test-program$/);
    assert.deepStrictEqual(result.files, [
      'programs/test_program/src/lib.rs',
      'programs/test_program/Cargo.toml',
      'tests/test_program.ts',
      'Anchor.toml',
      'package.json',
      'tsconfig.json'
    ]);

    // Verify files exist
    const libRs = await fs.readFile(
      path.join(result.projectPath, 'programs', 'test_program', 'src', 'lib.rs'),
      'utf8'
    );
    assert.match(libRs, /#\[program\]/);
    assert.match(libRs, /pub mod test_program/);

    const cargoToml = await fs.readFile(
      path.join(result.projectPath, 'programs', 'test_program', 'Cargo.toml'),
      'utf8'
    );
    assert.match(cargoToml, /name = "test_program"/);
    assert.match(cargoToml, /anchor-lang/);

    const testFile = await fs.readFile(
      path.join(result.projectPath, 'tests', 'test_program.ts'),
      'utf8'
    );
    assert.match(testFile, /describe\("test_program"/);
    assert.match(testFile, /initialize/);

    const anchorToml = await fs.readFile(
      path.join(result.projectPath, 'Anchor.toml'),
      'utf8'
    );
    assert.match(anchorToml, /\[programs.devnet\]/);
    assert.match(anchorToml, /test_program/);

    const packageJson = JSON.parse(
      await fs.readFile(
        path.join(result.projectPath, 'package.json'),
        'utf8'
      )
    );
    assert.strictEqual(packageJson.name, 'test-program');
    // Anchor is in devDependencies (for testing), not dependencies
    assert.ok(packageJson.devDependencies['@coral-xyz/anchor']);
  });

  await t.test('with hyphenated name', async () => {
    const result = await scaffoldProgram({
      programName: 'token-vault'
    });

    assert.strictEqual(result.success, true);
    assert.match(result.projectPath, /token-vault$/);

    // Verify name conversion: token-vault -> token_vault
    const libRs = await fs.readFile(
      path.join(result.projectPath, 'programs', 'token_vault', 'src', 'lib.rs'),
      'utf8'
    );
    assert.match(libRs, /pub mod token_vault/);
  });

  await t.test('requires programName', async () => {
    assert.rejects(
      async () => {
        await scaffoldProgram({});
      },
      /programName is required/
    );
  });
});

test('scaffold_program generates valid Rust syntax', async (t) => {
  const result = await scaffoldProgram({
    programName: 'syntax-test'
  });

  const libRs = await fs.readFile(
    path.join(result.projectPath, 'programs', 'syntax_test', 'src', 'lib.rs'),
    'utf8'
  );

  // Check for Rust syntax elements
  assert.match(libRs, /use anchor_lang::prelude::\*/);
  assert.match(libRs, /declare_id!/);
  assert.match(libRs, /#\[program\]/);
  assert.match(libRs, /#\[derive\(Accounts\)\]/);
  assert.match(libRs, /-> Result<\(\)>/);
});
