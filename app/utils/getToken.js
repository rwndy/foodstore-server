const getToken = req => {
    let token = null;

    if (req.headers && req.headers.authorization) {
        const authHeader = req.headers.authorization;

        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            token = authHeader;
        }
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }
    // Check body as fallback
    else if (req.body && req.body.token) {
        token = req.body.token;
    }

    return token ? token.trim() : null;
};

module.exports = { getToken };
