module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
      'nativewind/babel',
    ],

    plugins: [
      // CRITICAL: react-native-dotenv MUST come before module-resolver
      // Otherwise @env module won't be resolved correctly
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: `.env.${process.env.APP_ENV || 'development'}`,
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      // PERFORMANCE FIX: Remove console.log in production builds
      // Keep console.error and console.warn for debugging
      ...(process.env.NODE_ENV === 'production'
        ? [
            [
              'transform-remove-console',
              {
                exclude: ['error', 'warn'],
              },
            ],
          ]
        : []),
      'react-native-reanimated/plugin'
    ],
  };
};
