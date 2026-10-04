import test from 'node:test';
import assert from 'node:assert/strict';
import { createVirtualFs, HOME, runVirtualCommand, saveVirtualFile } from './virtualTerminal.js';

const context = { cwd: HOME, logText: '2026-09-12 update\nerror fixed\nlast line', history: ['ls', 'history'], startedAt: Date.now() - 5000 };
const run = (input, cwd = HOME) => runVirtualCommand(input, { ...context, cwd });

test('navigates virtual directories and prints paths', () => {
    assert.equal(run('pwd').output, HOME);
    assert.equal(run('cd docs').cwd, `${HOME}/docs`);
    assert.equal(run('cd ..', `${HOME}/docs`).cwd, HOME);
    assert.equal(run('cd ~', `${HOME}/docs`).cwd, HOME);
    assert.equal(run('cd .').cwd, HOME);
    assert.equal(run('cd ..').cwd, '/home');
});

test('lists regular, hidden, detailed, and target entries', () => {
    assert.match(run('ls').output, /docs\//);
    assert.doesNotMatch(run('ls').output, /\.config/);
    assert.match(run('ls -a').output, /\.config\//);
    assert.match(run('ls -l').output, /visitor/);
    assert.match(run('ls -la').output, /\.config\//);
    assert.match(run('ls docs').output, /changelog\.log/);
});

test('reads and searches only virtual files', () => {
    assert.equal(run('cat docs/changelog.log').output, context.logText);
    assert.equal(run('log').output, context.logText);
    assert.equal(run('head -2 docs/changelog.log').output, '2026-09-12 update\nerror fixed');
    assert.equal(run('tail -1 docs/changelog.log').output, 'last line');
    assert.match(run('grep -i ERROR docs/changelog.log').output, /error fixed/);
    assert.match(run('find docs -name changelog.log').output, /changelog\.log/);
    assert.match(run('locate changelog').output, /changelog\.log/);
    assert.equal(run('less docs/changelog.log').viewer.text, context.logText);
    assert.equal(run('nano docs/changelog.log').viewer.text, context.logText);
    assert.equal(run('vim docs/changelog.log').viewer.text, context.logText);
});

test('supports utilities and never executes writes', () => {
    assert.equal(run('echo "hello world"').output, 'hello world');
    assert.equal(run('whoami').output, 'visitor (虚拟用户)');
    assert.match(run('uname -a').output, /模拟/);
    assert.match(run('uptime').output, /秒/);
    assert.match(run('df -h').output, /模拟/);
    assert.match(run('du docs/changelog.log').output, /bytes/);
    assert.match(run('ps aux').output, /模拟/);
    assert.equal(run('history').output.split('\n').length, 2);
    assert.equal(run('clear').clear, true);
    assert.match(run('man ls').output, /ls/);
    for (const command of ['touch a', 'mkdir -p A/B/C', 'mkdir-p A/B/C', 'sudo apt update', 'rm -rf docs', 'echo x > a', 'wget https://example.com', 'tar -xzf a.tgz']) {
        assert.equal(run(command).blocked, true, command);
    }
});

test('test directory changes stay in a supplied in-memory filesystem', () => {
    const initial = createVirtualFs(context.logText);
    const created = runVirtualCommand('mkdir -p test/A/B/C', { ...context, fs: initial });
    assert.equal(created.blocked, undefined);
    assert.match(runVirtualCommand('ls test/A/B', { ...context, fs: created.fs }).output, /C\//);
    const touched = runVirtualCommand('touch test/A/B/C/note.txt', { ...context, fs: created.fs });
    const written = runVirtualCommand('echo "hello world" > test/A/B/C/note.txt', { ...context, fs: touched.fs });
    assert.equal(runVirtualCommand('cat test/A/B/C/note.txt', { ...context, fs: written.fs }).output, 'hello world\n');
    const copied = runVirtualCommand('cp docs/changelog.log test/copy.log', { ...context, fs: written.fs });
    assert.equal(runVirtualCommand('cat test/copy.log', { ...context, fs: copied.fs }).output, context.logText);
    const saved = saveVirtualFile(copied.fs, `${HOME}/test/copy.log`, 'edited');
    assert.equal(runVirtualCommand('cat test/copy.log', { ...context, fs: saved.fs }).output, 'edited');
    const removed = runVirtualCommand('rm -r test/A', { ...context, fs: saved.fs });
    assert.doesNotMatch(runVirtualCommand('ls test', { ...context, fs: removed.fs }).output, /A\//);
    assert.match(runVirtualCommand('ls test', { ...context, fs: initial }).output, /hello\.txt/);
});

test('writes crossing the test boundary are blocked', () => {
    const fs = createVirtualFs(context.logText);
    for (const command of ['touch docs/a', 'mkdir ../outside', 'rm docs/changelog.log', 'mv docs/changelog.log test/moved.log', 'cp test/hello.txt docs/copy.txt', 'echo x > docs/a', 'sudo mkdir docs/secret']) {
        assert.equal(runVirtualCommand(command, { ...context, fs }).blocked, true, command);
    }
    assert.equal(saveVirtualFile(fs, `${HOME}/docs/changelog.log`, 'bad').blocked, true);
    assert.equal(runVirtualCommand('sudo touch test/ok.txt', { ...context, fs }).blocked, undefined);
    assert.equal(runVirtualCommand('nano test/new.txt', { ...context, fs }).viewer.writable, true);
    assert.equal(runVirtualCommand('nano docs/changelog.log', { ...context, fs }).viewer.writable, false);
});
