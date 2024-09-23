import * as child_process from "child_process";
import { injectable } from "inversify";

@injectable()
export class UtilsService {
  isValidIPv4(str: string): boolean {
    if (!str) return false;

    const blocks = str.split(".");

    if (blocks.length !== 4) {
      return false;
    }

    for (let value of blocks) {
      const num = parseInt(value, 10);

      if (Number.isNaN(num) || num < 0 || num > 255) {
        return false;
      }
    }

    return true;
  }

  exec(command: string): Promise<string> {
    if (process.platform !== "linux") {
      return Promise.resolve("");
    }

    return new Promise((resolve, reject) => {
      child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${stderr}`);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}
