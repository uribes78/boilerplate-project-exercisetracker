const { Router } = require('express');
const models = require('./models');
const mongoose = require('mongoose');

const { MONGO_URL } = process.env;

const api = () => {
    let routes = new Router();

    mongoose.connect(MONGO_URL);

    routes.get('/users', (req, res) => {
        models.User.find().then((docs) => {
            res.status(200).json(docs).end();
        }).catch(err => res.status(500).json({error: err.message}).end());
    });

    routes.get('/users/:_id/logs', (req, res, next) => {
        let { _id } = req.params;
        let { from, to, limit } = req.query;

        if (!_id)
            return next(new ReferenceError('Invalid user', {cause: 400}));

        models.User.findById(_id, {
            __v: 0,
            "log._id": 0,
            "log.__v": 0
        }).then((user) => {
            if (!user)
                return next(new ReferenceError('User not found', {cause: 404}));

            let logs = user.log.filter((log) => {
                let ts = log.date.getTime();

                if (from && to) {
                    let start = Date.parse(from),
                        end = Date.parse(to);

                    return (ts >= start && ts <= end);
                } else if (from && !to) {
                    let start = Date.parse(from);

                    return (ts >= start);
                } else if (!from && to) {
                    let end = Date.parse(to);

                    return (ts <= end);
                }

                return true;
            }).map((exercise) => {
                return {
                    description: exercise.description,
                    duration: exercise.duration,
                    date: exercise.date.toDateString()
                };
            });

            if (logs.length && limit)
                logs.splice(limit);

            res.status(200).json({
                _id: user._id.toString(),
                username: user.username,
                count: logs.length,
                log: logs
            }).end();
        }).catch(err => next(err));
    });

    routes.post('/users', (req, res, next) => {
        let { username } = req.body;

        if (!username)
            return new ReferenceError('Invalid username', {cause: 400});

        let user = new models.User({ username });

        user.save().then((result) => {
            res.status(201).json({
                username: result.username,
                _id: result._id.toString()
            }).end();
        }).catch(err => next(err));
    });

    routes.post('/users/:_id/exercises', (req, res, next) => {
        const { _id } = req.params;
        const { description, duration, date } = req.body;

        if (!_id)
            return next(new ReferenceError('Invalid user', {cause: 400}));

        models.User.findById(_id)
            .then((user) => {
                if (!user)
                    next(new ReferenceError('User not found', {cause: 404}));

                let log = {
                    description: description,
                    duration: duration,
                    date: new Date( (date ? Date.parse(date) : Date.now()) )
                };


                if (!Array.isArray(user.log))
                    user.log = [];

                user.log.push(log)
                user.count = user.log.length;

                user.save().then((result) => {
                    log._id = user._id.toString();
                    log.username = user.username;
                    log.date = log.date.toDateString();

                    res.status(200).json(log).end();
                });
            }).catch(err => next(err));
    });

    return routes;
};

module.exports = api;
