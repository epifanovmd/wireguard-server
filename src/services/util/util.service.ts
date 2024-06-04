import * as child_process from "child_process";

export class Util {
  static isValidIPv4(str) {
    const blocks = str.split(".");

    if (blocks.length !== 4) {
      return false;
    }

    for (let value of blocks) {
      value = parseInt(value, 10);
      if (Number.isNaN(value)) {
        return false;
      }
      if (value < 0 || value > 255) {
        return false;
      }
    }

    return true;
  }

  static promisify(fn) {
    // eslint-disable-next-line func-names
    return (req, res) => {
      Promise.resolve()
        .then(() => fn(req, res))
        .then(result => {
          if (res.headersSent) {
            return;
          }

          if (typeof result === "undefined") {
            return res.status(204).end();
          }

          return res.status(200).json(result);
        })
        .catch(_error => {
          let error = _error;

          if (typeof error === "string") {
            error = new Error(error);
          }

          // eslint-disable-next-line no-console
          console.error(error);

          return res.status(error.statusCode || 500).json({
            error: error.message || error.toString(),
            stack: error.stack,
          });
        });
    };
  }

  static exec(
    cmd,
    opts: { log?: string | boolean } = { log: true },
  ): Promise<string> {
    if (typeof opts.log === "string") {
      // eslint-disable-next-line no-console
      console.log(`$ ${opts.log}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`$ ${cmd}`);
    }

    if (process.platform !== "linux") {
      return Promise.resolve("");
    }

    return new Promise((resolve, reject) => {
      child_process.exec(
        cmd,
        {
          shell: "bash",
        },
        (err, stdout) => {
          if (err) {
            return reject(err);
          }

          return resolve(String(stdout).trim());
        },
      );
    });
  }
}
