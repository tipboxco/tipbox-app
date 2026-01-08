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
