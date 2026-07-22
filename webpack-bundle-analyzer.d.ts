declare module 'webpack-bundle-analyzer' {
  interface BundleAnalyzerPluginOptions {
    analyzerMode?: 'server' | 'static' | 'json' | 'disabled';
    reportFilename?: string;
    openAnalyzer?: boolean;
    generateStatsFile?: boolean;
    statsFilename?: string;
  }

  export class BundleAnalyzerPlugin {
    constructor(options?: BundleAnalyzerPluginOptions);
    apply(compiler: unknown): void;
  }
}
