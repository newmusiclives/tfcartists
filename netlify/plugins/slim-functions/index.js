// Remove large static files from the server function handler
// to keep it under the 250MB Netlify limit.
// These files are still served from the static CDN.
const fs = require("fs");
const path = require("path");

module.exports = {
  onPostBuild({ constants, utils }) {
    const handlerPublic = path.join(
      constants.PUBLISH_DIR,
      "..",
      ".netlify",
      "functions-internal",
      "___netlify-server-handler",
      "public"
    );

    const dirsToRemove = ["audio", "team", "djs"];
    const removed = [];

    for (const dir of dirsToRemove) {
      const fullPath = path.join(handlerPublic, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        removed.push(dir);
      }
    }

    if (removed.length > 0) {
      utils.status.show({
        title: "Slimmed server function",
        summary: `Removed public/${removed.join(", public/")} from server handler (served from CDN instead)`,
      });
    }
  },
};
