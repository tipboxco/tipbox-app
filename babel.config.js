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
    ],
  };
};
