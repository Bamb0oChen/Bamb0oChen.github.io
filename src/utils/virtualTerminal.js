const HOME = '/home/visitor';
const DIRECTORIES = ['/', '/home', HOME, `${HOME}/docs`, `${HOME}/logs`, `${HOME}/photos`, `${HOME}/.config`, `${HOME}/test`];
const TEST_ROOT = `${HOME}/test`;
const FIXED_FILES = {
    [`${HOME}/README.txt`]: '这是网站更新日志的虚拟终端。\n输入 ls 查看目录，输入 cat docs/changelog.log 阅读更新记录。',
    [`${HOME}/logs/site.log`]: 'site started\ngallery ready\nchangelog terminal ready',
    [`${HOME}/.config/terminal.conf`]: 'mode=demo\nfilesystem=read-only'
};
const BLOCKED = new Set(['su', 'doas', 'tee', 'dd', 'apt', 'apk', 'dnf', 'brew', 'wget', 'curl', 'updatedb', 'tar', 'git', 'npm', 'pip', 'python', 'node', 'bash', 'sh', 'ln', 'install', 'systemctl', 'service', 'reboot', 'shutdown']);
const WRITES = new Set(['touch', 'mkdir', 'mkdir-p', 'cp', 'mv', 'rm', 'rmdir', 'chmod', 'chown', 'chgrp']);
const HELP = {
    ls: 'ls [-a] [-l] [-la] [目录或文件]：列出虚拟目录内容。',
    cd: 'cd [目录]：切换虚拟目录；支持 .、..、~。',
    pwd: 'pwd：显示当前虚拟路径。',
    cat: 'cat 文件：输出虚拟文件全部内容。',
    less: 'less 文件：滚动查看虚拟文件，按 Esc 或 q 退出。',
    nano: 'nano 文件：test/ 内可编辑，其他目录只读。',
    vim: 'vim 文件：test/ 内可编辑，其他目录只读。',
    head: 'head -20 文件：查看前 20 行；数字可以替换。',
    tail: 'tail -20 文件：查看后 20 行；数字可以替换。',
    grep: 'grep [-i] [-r] 文本 文件或目录：查找虚拟文件内容。',
    find: 'find [目录] [名称]：按名称查找虚拟文件和目录。',
    locate: 'locate 文本：按名称搜索虚拟文件。',
    history: 'history：查看本页输入过的命令；↑/↓ 调用历史。',
    clear: 'clear：清空终端输出，不删除文件。',
    log: 'log：输出更新日志。',
    echo: 'echo 文本：在终端显示文本。',
    whoami: 'whoami：显示虚拟用户。',
    uname: 'uname [-a]：显示虚拟系统信息。',
    uptime: 'uptime：显示本次页面会话时长。',
    df: 'df -h：显示虚拟文件系统占用。',
    du: 'du [文件或目录]：显示虚拟文件大小。',
    ps: 'ps aux：显示模拟进程快照。',
    top: 'top：显示模拟进程视图。',
    htop: 'htop：显示模拟进程视图。',
    man: 'man 命令：阅读本终端支持的命令说明。',
    touch: 'touch 文件：仅可在 test/ 内创建虚拟文件。',
    mkdir: 'mkdir [-p] 目录：仅可在 test/ 内创建虚拟目录。',
    cp: 'cp [-r] 来源 目标：仅可写入 test/。',
    mv: 'mv 来源 目标：来源和目标都必须在 test/。',
    rm: 'rm [-r] 文件或目录：仅可删除 test/ 内的内容。',
    rmdir: 'rmdir 目录：仅可删除 test/ 内的空目录。'
};

export function tokenizeCommand(input) {
    const tokens = [];
    const matcher = /"([^"]*)"|'([^']*)'|(\S+)/g;
    for (const match of input.matchAll(matcher)) tokens.push(match[1] ?? match[2] ?? match[3]);
    return tokens;
}

export function normalizePath(cwd, input = '.') {
    const raw = input === '~' ? HOME : input.startsWith('~/') ? `${HOME}/${input.slice(2)}` : input.startsWith('/') ? input : `${cwd}/${input}`;
    const parts = [];
    for (const part of raw.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    return `/${parts.join('/')}`;
}

export function displayPath(path) {
    return path === HOME ? '~' : path.startsWith(`${HOME}/`) ? `~/${path.slice(HOME.length + 1)}` : path;
}

export function createVirtualFs(logText = '') {
    return {
        directories: [...DIRECTORIES],
        files: { ...FIXED_FILES, [`${HOME}/docs/changelog.log`]: logText, [`${HOME}/changelog.log`]: logText, [`${TEST_ROOT}/hello.txt`]: 'Hello from test/!\n这里的修改只存在于当前页面。' },
        metadata: {}
    };
}

function pathExists(path, files, directories) { return directories.includes(path) || Object.hasOwn(files, path); }
function isDirectory(path, directories) { return directories.includes(path); }
function basename(path) { return path.split('/').at(-1); }
function parentPath(path) { return path.slice(0, path.lastIndexOf('/')) || '/'; }
function writable(path) { return path.startsWith(`${TEST_ROOT}/`); }

function childrenOf(path, files, directories, includeHidden) {
    const all = [...directories, ...Object.keys(files)];
    return all.filter(item => item !== path && item.startsWith(`${path}/`) && !item.slice(path.length + 1).includes('/'))
        .filter(item => includeHidden || !basename(item).startsWith('.'))
        .sort((a, b) => basename(a).localeCompare(b));
}

function fileText(cwd, path, files) {
    const resolved = normalizePath(cwd, path);
    if (!Object.hasOwn(files, resolved)) return { error: `${path}: 没有这个文件` };
    return { path: resolved, text: files[resolved] };
}

function listPath(cwd, args, files, directories, metadata) {
    const flags = args.filter(arg => /^-[al]+$/.test(arg)).join('');
    const paths = args.filter(arg => !/^-[al]+$/.test(arg));
    if (paths.length > 1 || args.some(arg => arg.startsWith('-') && !/^-[al]+$/.test(arg))) return 'ls: 仅支持 -a、-l、-la 和一个路径';
    const target = normalizePath(cwd, paths[0] || '.');
    if (!pathExists(target, files, directories)) return `ls: ${paths[0]}: 没有这个文件或目录`;
    const long = flags.includes('l');
    const all = flags.includes('a');
    const items = isDirectory(target, directories) ? childrenOf(target, files, directories, all) : [target];
    const names = isDirectory(target, directories) && all ? ['.', '..', ...items.map(basename)] : items.map(basename);
    if (!long) return names.map(name => {
        const item = items.find(path => basename(path) === name);
        return item && isDirectory(item, directories) ? `${name}/` : name;
    }).join('  ');
    return names.map(name => {
        const item = items.find(path => basename(path) === name);
        const directory = name === '.' || name === '..' || (item && isDirectory(item, directories));
        const size = item && !directory ? new TextEncoder().encode(files[item]).length : 0;
        return `${metadata[item]?.mode || (directory ? 'dr-xr-xr-x' : '-r--r--r--')}  ${metadata[item]?.owner || 'visitor'}  ${String(size).padStart(5)}  ${directory && !name.endsWith('/') ? `${name}/` : name}`;
    }).join('\n');
}

function grepText(cwd, args, files, directories) {
    const insensitive = args.includes('-i');
    const recursive = args.includes('-r');
    const positional = args.filter(arg => arg !== '-i' && arg !== '-r');
    if (positional.length < 2) return HELP.grep;
    const [query, targetName] = positional;
    const target = normalizePath(cwd, targetName);
    const targets = recursive && isDirectory(target, directories) ? Object.keys(files).filter(path => path.startsWith(`${target}/`)) : [target];
    if (isDirectory(target, directories) && !recursive) return 'grep: 目录需要 -r 参数';
    if (!targets.every(path => Object.hasOwn(files, path))) return `grep: ${targetName}: 没有这个文件`;
    const needle = insensitive ? query.toLowerCase() : query;
    return targets.flatMap(path => files[path].split('\n').filter(line => (insensitive ? line.toLowerCase() : line).includes(needle)).map(line => `${displayPath(path)}:${line}`)).join('\n') || '没有匹配结果';
}

export function saveVirtualFile(fs, path, text) {
    if (!writable(path) || !fs.directories.includes(parentPath(path))) return { blocked: true, fs };
    return { fs: { ...fs, files: { ...fs.files, [path]: text } }, blocked: false };
}

function writeCommand(verb, args, cwd, fs) {
    const files = { ...fs.files };
    const directories = [...fs.directories];
    const metadata = { ...fs.metadata };
    const nextFs = { files, directories, metadata };
    const flags = args.filter(arg => arg.startsWith('-'));
    const names = args.filter(arg => !arg.startsWith('-'));
    const paths = names.map(name => normalizePath(cwd, name));
    const target = paths.at(-1);
    const source = paths[0];
    const blocked = () => ({ output: '', cwd, fs, blocked: true });
    const fail = message => ({ output: `${verb}: ${message}`, cwd, fs, error: true });
    const done = output => ({ output, cwd, fs: nextFs });

    if (!names.length) return fail(HELP[verb] || '需要路径参数');
    if ((verb === 'cp' || verb === 'mv') && names.length !== 2) return fail('需要来源和目标两个路径');
    if ((verb === 'cp' || verb === 'mv') && (!(writable(target) || target === TEST_ROOT) || (verb === 'mv' && !writable(source)))) return blocked();
    if (['chmod', 'chown', 'chgrp'].includes(verb)) {
        if (paths.slice(1).some(path => !writable(path))) return blocked();
    } else if (!['cp', 'mv'].includes(verb) && paths.some(path => !writable(path))) return blocked();

    if (verb === 'touch') {
        for (const path of paths) {
            if (!directories.includes(parentPath(path)) || directories.includes(path)) return fail(`${displayPath(path)}: 父目录不存在或目标是目录`);
            files[path] ??= '';
            metadata[path] = { ...metadata[path], modified: Date.now() };
        }
        return done('');
    }
    if (verb === 'mkdir' || verb === 'mkdir-p') {
        const recursive = verb === 'mkdir-p' || flags.includes('-p');
        for (const path of paths) {
            if (pathExists(path, files, directories)) return fail(`${displayPath(path)}: 已存在`);
            if (recursive) {
                let current = TEST_ROOT;
                for (const part of path.slice(TEST_ROOT.length + 1).split('/')) {
                    current += `/${part}`;
                    if (Object.hasOwn(files, current)) return fail(`${displayPath(current)}: 已是文件`);
                    if (!directories.includes(current)) directories.push(current);
                }
            } else if (directories.includes(parentPath(path))) directories.push(path);
            else return fail(`${displayPath(path)}: 父目录不存在`);
        }
        return done('');
    }
    if (verb === 'cp' || verb === 'mv') {
        if (!pathExists(source, files, directories)) return fail(`${displayPath(source)}: 不存在`);
        const destination = directories.includes(target) ? `${target}/${basename(source)}` : target;
        if (!writable(destination) || !directories.includes(parentPath(destination))) return blocked();
        if (directories.includes(source)) {
            if (!flags.includes('-r') && verb === 'cp') return fail('复制目录需要 -r');
            if (destination === source || destination.startsWith(`${source}/`)) return fail('不能复制或移动到自身内部');
            const subdirs = directories.filter(path => path === source || path.startsWith(`${source}/`));
            const subfiles = Object.keys(files).filter(path => path.startsWith(`${source}/`));
            for (const path of [...subdirs, ...subfiles]) if (!writable(destination + path.slice(source.length))) return blocked();
            for (const path of subdirs) if (!directories.includes(destination + path.slice(source.length))) directories.push(destination + path.slice(source.length));
            for (const path of subfiles) files[destination + path.slice(source.length)] = files[path];
            if (verb === 'mv') {
                for (const path of subfiles) delete files[path];
                for (const path of subdirs) directories.splice(directories.indexOf(path), 1);
            }
        } else {
            files[destination] = files[source];
            if (verb === 'mv') delete files[source];
        }
        return done(flags.includes('-v') ? `${displayPath(source)} -> ${displayPath(destination)}` : '');
    }
    if (verb === 'rm' || verb === 'rmdir') {
        for (const path of paths) {
            if (!pathExists(path, files, directories)) {
                if (flags.includes('-f')) continue;
                return fail(`${displayPath(path)}: 不存在`);
            }
            if (directories.includes(path)) {
                const children = childrenOf(path, files, directories, true);
                if (children.length && (verb === 'rmdir' || !flags.includes('-r'))) return fail(`${displayPath(path)}: 目录非空或缺少 -r`);
                for (const file of Object.keys(files).filter(item => item.startsWith(`${path}/`))) delete files[file];
                for (const dir of directories.filter(item => item === path || item.startsWith(`${path}/`))) directories.splice(directories.indexOf(dir), 1);
            } else delete files[path];
            delete metadata[path];
        }
        return done(flags.includes('-v') || flags.includes('-i') ? paths.map(displayPath).join('\n') : '');
    }
    if (verb === 'chmod' || verb === 'chown' || verb === 'chgrp') {
        if (names.length < 2) return fail('需要参数和目标');
        const setting = names[0];
        const affected = paths.slice(1);
        if (affected.some(path => !pathExists(path, files, directories))) return fail('目标不存在');
        for (const path of affected) metadata[path] = { ...metadata[path], [verb === 'chmod' ? 'mode' : 'owner']: setting };
        return done('');
    }
    return fail('不支持的写入命令');
}

export function runVirtualCommand(input, { cwd = HOME, history = [], logText = '', startedAt = Date.now(), fs = createVirtualFs(logText) } = {}) {
    const { files, directories, metadata } = fs;
    const tokens = tokenizeCommand(input.trim());
    const [verb, ...args] = tokens;
    if (!verb) return { output: '', cwd };
    const echoRedirect = input.trim().match(/^echo\s+(.+?)\s*(>>?)\s*(\S+)$/);
    if (echoRedirect) {
        const target = normalizePath(cwd, echoRedirect[3]);
        if (!writable(target)) return { output: '', cwd, fs, blocked: true };
        if (!directories.includes(parentPath(target))) return { output: `echo: ${echoRedirect[3]}: 父目录不存在`, cwd, fs, error: true };
        const value = tokenizeCommand(echoRedirect[1]).join(' ');
        const next = echoRedirect[2] === '>>' ? `${files[target] || ''}${value}\n` : `${value}\n`;
        return { output: '', cwd, fs: { ...fs, files: { ...files, [target]: next } } };
    }
    const hasOperator = /[>|;&`]/.test(input) || /\$\(/.test(input);
    if (BLOCKED.has(verb.toLowerCase()) || hasOperator) return { output: '', cwd, fs, blocked: true };
    if (args.includes('--help') && HELP[verb]) return { output: HELP[verb], cwd };
    if (verb === 'sudo') return runVirtualCommand(args.join(' '), { cwd, history, logText, startedAt, fs });
    if (WRITES.has(verb)) return writeCommand(verb, args, cwd, fs);

    if (verb === 'ls') return { output: listPath(cwd, args, files, directories, metadata), cwd };
    if (verb === 'pwd') return { output: cwd, cwd };
    if (verb === 'cd') {
        const target = normalizePath(cwd, args[0] || '~');
        return isDirectory(target, directories) && args.length <= 1 ? { output: '', cwd: target } : { output: `cd: ${args[0]}: 没有这个目录`, cwd, error: true };
    }
    if (verb === 'clear') return { output: '', cwd, clear: true };
    if (verb === 'history') return { output: history.map((entry, index) => `${String(index + 1).padStart(3)}  ${entry}`).join('\n'), cwd };
    if (verb === 'log') return { output: logText, cwd };
    if (verb === 'whoami') return { output: 'visitor (虚拟用户)', cwd };
    if (verb === 'uname') return { output: args.includes('-a') ? 'VirtualUnix homepage 1.0 browser-demo (模拟环境，非服务器内核)' : 'VirtualUnix (模拟)', cwd };
    if (verb === 'uptime') return { output: `本页会话已运行 ${Math.floor((Date.now() - startedAt) / 1000)} 秒（模拟）`, cwd };
    if (verb === 'echo') return { output: args.join(' '), cwd };
    if (verb === 'df') return { output: 'Filesystem       Size  Used  Avail\nvirtual-home      1M    8K   1016K  (模拟)', cwd };
    if (verb === 'du') {
        const target = normalizePath(cwd, args.at(-1)?.startsWith('-') ? '.' : args.at(-1) || '.');
        if (!pathExists(target, files, directories)) return { output: `du: ${args.at(-1)}: 没有这个文件`, cwd, error: true };
        const size = isDirectory(target, directories) ? Object.entries(files).filter(([path]) => path.startsWith(`${target}/`)).reduce((sum, [, value]) => sum + new TextEncoder().encode(value).length, 0) : new TextEncoder().encode(files[target]).length;
        return { output: `${size} bytes  ${displayPath(target)} (虚拟)`, cwd };
    }
    if (verb === 'ps') return { output: 'USER      PID  COMMAND\nvisitor     1  homepage-terminal (模拟)', cwd };
    if (verb === 'top' || verb === 'htop') return { output: '虚拟进程视图\nPID  CPU  MEM  COMMAND\n  1   0%   8K  homepage-terminal\n（没有访问真实系统进程）', cwd, viewer: { name: verb, text: 'PID  CPU  MEM  COMMAND\n  1   0%   8K  homepage-terminal\n\n模拟数据，不代表服务器或设备。' } };
    if (verb === 'man') return { output: HELP[args[0]] || `man: 没有 ${args[0] || ''} 的内置说明`, cwd };
    if (verb === 'find') {
        const root = normalizePath(cwd, args[0] || '.');
        if (!isDirectory(root, directories)) return { output: `find: ${args[0]}: 没有这个目录`, cwd, error: true };
        const nameIndex = args.indexOf('-name');
        const query = nameIndex >= 0 ? args[nameIndex + 1]?.replaceAll('*', '') : args[1] || '';
        return { output: [...directories, ...Object.keys(files)].filter(path => path === root || path.startsWith(`${root}/`)).filter(path => !query || basename(path).includes(query)).map(displayPath).join('\n'), cwd };
    }
    if (verb === 'locate') return { output: [...directories, ...Object.keys(files)].filter(path => path.toLowerCase().includes((args[0] || '').toLowerCase())).map(displayPath).join('\n') || '没有匹配结果', cwd };
    if (verb === 'grep') return { output: grepText(cwd, args, files, directories), cwd };
    if (['cat', 'less', 'nano', 'vim', 'vi', 'head', 'tail'].includes(verb)) {
        const lineCount = ['head', 'tail'].includes(verb) && /^-\d+$/.test(args[0] || '') ? Math.min(1000, Number(args.shift().slice(1))) : 10;
        const targetName = args[0];
        if (!targetName) return { output: HELP[verb] || `用法：${verb} 文件`, cwd };
        const file = fileText(cwd, targetName, files);
        if (file.error && ['nano', 'vim', 'vi'].includes(verb) && writable(normalizePath(cwd, targetName)) && directories.includes(parentPath(normalizePath(cwd, targetName)))) {
            const path = normalizePath(cwd, targetName);
            return { output: '', cwd, viewer: { name: verb, path: displayPath(path), absolutePath: path, text: '', writable: true } };
        }
        if (file.error) return { output: `${verb}: ${file.error}`, cwd, error: true };
        if (verb === 'head') return { output: file.text.split('\n').slice(0, lineCount).join('\n'), cwd };
        if (verb === 'tail') return { output: file.text.split('\n').slice(-lineCount).join('\n'), cwd };
        if (verb === 'cat') return { output: file.text, cwd };
        return { output: '', cwd, viewer: { name: verb, path: displayPath(file.path), absolutePath: file.path, text: file.text, writable: writable(file.path) && ['nano', 'vim', 'vi'].includes(verb) } };
    }
    return { output: `不支持的命令：${verb}。输入 man 命令名 或 命令 --help 查看支持范围。`, cwd, error: true };
}

export { HOME, HELP };
