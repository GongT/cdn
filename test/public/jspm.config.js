SystemJS.config({
  paths: {
    "test/": "client/"
  },
  browserConfig: {
    "baseURL": "/public"
  },
  packages: {
    "test": {
      "main": "index.js",
      "format": "cjs"
    }
  }
});

SystemJS.config({
  packageConfigPaths: [],
  map: {},
  packages: {}
});
