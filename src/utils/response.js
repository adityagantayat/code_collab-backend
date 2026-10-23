export const sendResponse = (res, statusCode, success, message, data = null) => {
    return res.status(statusCode).json({
        success,
        error: !success,
        message,
        data,
    });
};

export const sendSuccess = (res, statusCode, message, data = null) => {
    return sendResponse(res, statusCode, true, message, data);
};

export const sendError = (res, statusCode, message, data = null) => {
    return sendResponse(res, statusCode, false, message, data);
};
