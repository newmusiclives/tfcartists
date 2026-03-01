// Remove large static files from the server function handler
// to keep it under the 250MB Netlify limit.
// Audio files are still served from the static CDN.
const fs = require("fs");
const path = require("path");

module.exports = {
  onPostBuild({ constants, utils }) {
    const handlerDir = path.join(
      constants.PUBLISH_DIR,
      "..",
      ".netlify",
      "functions-internal",
      "___netlify-server-handler",
      "public",
      "audio"
    );

    if (fs.existsSync(handlerDir)) {
      fs.rmSync(handlerDir, { recursive: true, force: true });
      utils.status.show({
        title: "Slimmed server function",
        summary: "Removed public/audio from server handler (served from CDN instead)",
      });
    }
  },
};
