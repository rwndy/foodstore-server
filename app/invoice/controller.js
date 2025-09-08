const { subject } = require('@casl/ability');
const Invoice = require('./model');
const { policyFor } = require('../policy');

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
            return res.json({
                error: 1,
                message: `Anda tidak memiliki akses untuk melihat invoice ini.`,
            });
        }
        
        return res.json(invoice);

    } catch (error) {
        if (error && error.name === 'ValidationError') {
            return res.json({
                error: 1,
                message: `Error when getting invoice.`,
            });
        }

        next(error);
    }
};


module.exports = { getInvoice }