import {CoreConfig} from "@code-pushup/models";
import nxPerformancePlugin from "./tooling/measures/nx-performance/nx-performance.plugin";

const tasks = [
 'cli-e2e:e2e', 'cli-e2e-original:original-e2e'
];
export default {
  plugins: [
    nxPerformancePlugin({
      tasks
    })
  ],
} satisfies CoreConfig;
