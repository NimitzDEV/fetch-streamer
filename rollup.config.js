import typescript from '@rollup/plugin-typescript';
import terser from 'rollup-plugin-terser';
import strip from 'rollup-plugin-strip';

export default {
  input: './index.ts',
  output: {
    name: 'FetchStreamer',
    format: 'umd',
    file: 'dist/fetch-streamer.min.js'
  },
  plugins: [
    typescript({lib: ["es5", "es6", "dom"], target: "es5"}),
    terser.terser({output: {comments: false}}),
    strip({
      debugger: true,
      functions: ['console.log', 'assert.*', 'debug', 'alert'],
      sourceMap: false,
    }),
  ],
};
