import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { defineConfig } from "rollup";
import copy from "rollup-plugin-copy";
import typescript from "rollup-plugin-typescript2";

const config = defineConfig(() => {
  return {
    input: "src/app.server.ts",
    output: [
      {
        dir: "./build",
        format: "cjs",
        exports: "named",
        preserveModules: false,
        preserveModulesRoot: "src",
        sourcemap: true,
      },
    ],
    external: /node_modules/,
    plugins: [
      resolve(),
      commonjs(),
      terser({
        mangle: {
          keep_fnames: true,
          keep_classnames: true,
        },
      }),
      json(),
      typescript({
        useTsconfigDeclarationDir: true,
        tsconfig: "./tsconfig.production.json",
      }),
      copy({
        targets: [
          { src: "./public/*", dest: "./build" }, // копирование всех файлов из public в build
          { src: "./src/modules/mailer/*.ejs", dest: "./build" },
        ],
      }),
    ],
  };
});

export default config;
