import { exec } from 'child_process';
import * as vscode from 'vscode';
// 调用 Shell 命令查找文件及行列号
export async function findFileAndPosition(searchString: string, filePathStr: string, fileName: string, currentDir: string): Promise<{ file: string; line: number; column: number } | null> {
    return new Promise((resolve, reject) => {
      const command = `
          fd ${fileName} | grep ${filePathStr} | xargs rg --vimgrep -F '${searchString}' | head -n 1 | cut -d: -f1,2,3
      `;

      exec(command, { cwd: currentDir, shell: '/bin/bash' }, (error, stdout, stderr) => {
          if (error || stderr) {
              // reject(new Error(stderr || error.message));
              resolve(null);
              return;
          }

          const output = stdout.trim();
          if (!output) {
              resolve(null);
              return;
          }

          const [file, line, column] = output.split(':');
          resolve({
              file,
              line: parseInt(line, 10),
              column: parseInt(column, 10)
          });
      });
  });
}