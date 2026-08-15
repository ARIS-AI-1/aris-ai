const app = require("../server");

module.exports = (req, res) => {
    if (req.url.startsWith("/api")) {
        req.url = req.url.substring(4) || "/";
    }

    return app(req, res);
};
