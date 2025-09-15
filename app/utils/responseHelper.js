const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
};

const sendResponse = (res, statusCode, message, data = null, error = 0) => {
    const response = {
        status: statusCode,
        message,
        data
    };
    
    if (error) {
        response.error = error;
    }
    
    return res.status(statusCode).json(response);
};

const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
    return sendResponse(res, statusCode, message, data);
};

const sendError = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, data = null) => {
    return sendResponse(res, statusCode, message, data, 1);
};

module.exports = {
    sendResponse,
    sendSuccess,
    sendError,
    HTTP_STATUS
};