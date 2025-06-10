/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimization for production
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            // Optimize calculations
            calc: { precision: 3 },
            // Minimize colors
            colormin: { legacy: true },
            // Convert length units
            convertValues: { precision: 3 },
            // Discard duplicates
            discardDuplicates: true,
            // Discard empty rules
            discardEmpty: true,
            // Merge rules
            mergeRules: true,
            // Normalize charset
            normalizeCharset: { add: false },
            // Normalize display values
            normalizeDisplayValues: true,
            // Normalize positions
            normalizePositions: true,
            // Normalize repeat style
            normalizeRepeatStyle: true,
            // Normalize string
            normalizeString: true,
            // Normalize timing functions
            normalizeTimingFunctions: true,
            // Normalize unicode
            normalizeUnicode: true,
            // Normalize URL
            normalizeUrl: true,
            // Normalize whitespace
            normalizeWhitespace: true,
            // Ordered values
            orderedValues: true,
            // Reduce initial
            reduceInitial: true,
            // Reduce transforms
            reduceTransforms: true,
            // SVG optimization
            svgo: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false,
                    },
                  },
                },
              ],
            },
            // Unique selectors
            uniqueSelectors: true,
          },
        ],
      },
    }),
  },
};

export default config;
