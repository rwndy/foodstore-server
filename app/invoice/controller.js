const { subject } = require('@casl/ability');
const Invoice = require('./model');
const { policyFor } = require('../policy');
const {
    sendSuccess,
    sendError,
    HTTP_STATUS,
} = require('../utils/responseHelper');

const getInvoice = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const invoice = await Invoice.findOne({ order: order_id })
            .populate('order')
            .populate('user');

        let policy = policyFor(req.user);

        const subjectInvoice = subject('Invoice', {
            ...invoice,
            user_id: invoice.user._id,
        });

        if (!policy.can('read', subjectInvoice)) {
            return sendError(
                res,
                `You're not allowed to perform this action`,
                HTTP_STATUS.FORBIDDEN
            );
        }

        return sendSuccess(
            res,
            'Invoice retrieved successfully',
            { invoice },
            HTTP_STATUS.OK
        );
    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return sendError(
                res,
                error.message,
                HTTP_STATUS.UNPROCESSABLE_ENTITY,
                { fields: error.errors }
            );
        }
       return sendError(
           res,
           'Internal server error',
           HTTP_STATUS.INTERNAL_SERVER_ERROR
       );
    }
};


module.exports = { getInvoice }