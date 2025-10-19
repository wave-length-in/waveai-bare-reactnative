const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, { 
  input: './styles/global.css',
  inlineRem: 16,
  // Disable LightningCSS for EAS Build compatibility
  cssModules: false
})