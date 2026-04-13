import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';

// Rollup v4 requires ESM, use readFileSync instead of require()
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const banner = `/*!
 * ${pkg.name} ${pkg.version} <${pkg.homepage}>
 * Copyright (c) 2026-present html2pptx-pro contributors
 * Released under ${pkg.license} License
 */`;

const plugins = [
    resolve(),
    json(),
    typescript({
        sourceMap: true,
        inlineSources: true,
        compilerOptions: {
            outDir: 'dist',
            declarationDir: 'dist/types'
        }
    }),
    commonjs({
        include: 'node_modules/**'
    }),
    sourceMaps(),
];

export default [
    // UMD — bundle pptxgenjs so it works standalone via CDN/script tag
    {
        input: 'src/index.ts',
        output: {
            file: pkg.main,
            name: 'html2pptx',
            format: 'umd',
            banner,
            sourcemap: true,
            footer: 'if (typeof window !== "undefined" && window.html2pptx && window.html2pptx.default) { window.html2pptx = window.html2pptx.default; }'
        },
        watch: { include: 'src/**' },
        plugins,
    },
    // ESM — keep pptxgenjs external for npm consumers
    {
        input: 'src/index.ts',
        output: { file: pkg.module, format: 'esm', banner, sourcemap: true },
        external: ['pptxgenjs'],
        watch: { include: 'src/**' },
        plugins,
    },
];