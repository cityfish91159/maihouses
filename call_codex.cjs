const { spawn } = require('child_process');

const request = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "codex",
    arguments: {
      prompt: `Strictly audit these BE-9 Trust Close API files:
1. api/trust/close.ts
2. api/trust/_utils.ts
3. api/trust/send-notification.ts

Check for:
- Type safety issues (any, missing types, unsafe casts)
- Security vulnerabilities
- Error handling gaps
- Code duplication (DRY violations)
- Best practices violations

Output a numbered list of ALL defects found with file:line references. Be extremely strict.`,
      workingDirectory: process.cwd(),
      reasoningEffort: "high"
    }
  }
});

const child = spawn('npx', ['-y', 'codex-mcp-server'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd()
});

let output = '';
let error = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  error += data.toString();
});

child.on('close', (code) => {
  console.log('=== CODEX RESPONSE ===');
  if (output) {
    try {
      const parsed = JSON.parse(output.split('\n').filter(l => l.startsWith('{')).pop() || '{}');
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log(output);
    }
  }
  if (error && !error.includes('started successfully')) {
    console.log('=== STDERR ===');
    console.log(error);
  }
  console.log('Exit code:', code);
});

child.stdin.write(request);
child.stdin.end();
