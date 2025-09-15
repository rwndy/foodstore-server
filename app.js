const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const productRouter = require('./app/product/router');
const categoryRouter = require('./app/category/router');
const tagRouter = require('./app/tag/router');
const authRouter = require('./app/auth/router');
const { decodeToken } = require('./app/auth/middleware');
const wilayahRouter = require('./app/wilayah/router');
const deliveryRouter = require('./app/delivery-address/router');
const cartRouter = require('./app/cart/router');
const orderRouter = require('./app/order/router');
const invoiceRouter = require('./app/invoice/router');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(decodeToken());

app.use('/api/v1', productRouter);
app.use('/api/v1', categoryRouter);
app.use('/api/v1', tagRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1', wilayahRouter);
app.use('/api/v1', deliveryRouter);
app.use('/api/v1', cartRouter);
app.use('/api/v1', orderRouter);
app.use('/api/v1', invoiceRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
