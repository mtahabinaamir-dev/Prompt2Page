function success(reply, data = {}) {
    return {
        success: true,
        reply,
        data
    };
}

function failure(reply) {
    return {
        success: false,
        reply
    };
}

module.exports = {
    success,
    failure
};