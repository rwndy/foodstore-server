const getToken = req => {
    const token = req.headers.authorization
        ? req.headers.authorization.replace('Bearer ', '')
        : null;

    return token && token.length ? token : null;
};

module.exports = { getToken };
