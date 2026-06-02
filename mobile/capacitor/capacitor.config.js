const config = {
  appId: "com.educore.app",
  appName: "Educore",
  webDir: "../../out",
  bundledWebRuntime: false,
};

if (process.env.CAPACITOR_DEV_SERVER_URL) {
  config.server = {
    url: process.env.CAPACITOR_DEV_SERVER_URL,
    cleartext: true,
  };
}

module.exports = config;
