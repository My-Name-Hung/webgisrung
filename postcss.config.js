module.exports = {
  plugins: {
    autoprefixer: {},
    "postcss-modules": {
      generateScopedName: "[name]__[local]___[hash:base64:5]",
      localsConvention: "camelCase",
    },
  },
};
