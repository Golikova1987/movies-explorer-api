const { default: mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const { BadRequestError } = require('../errors/BadRequestError');
const { NotFoundError } = require('../errors/NotFoundError');
const { ConflictError } = require('../errors/ConflictError');

const { SECRET_KEY = 'token' } = process.env;

// создание нового пользователя
module.exports.createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    })
      .then((user) => res.send({
        _id: user._id, email: user.email, name: user.name,
      }))
      .catch((err) => {
        if (err.code === 11000) {
          next(new ConflictError('Пользователь c данным email уже зарегистрирован'));
        } else if (err instanceof mongoose.Error.ValidationError) {
          next(new BadRequestError(err.message));
        } else {
          next(err);
        }
      }));
};

// обновление данных пользователя
module.exports.updateUserInfo = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: 'true', runValidators: true })
    .orFail()
    .then((user) => res.send(user))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequestError(err.message));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Пользователь не найден'));
      } else {
        next(err);
      }
    });
};

// получение информации о пользователе
module.exports.getUserInfo = (req, res, next) => {
  const userId = req.user._id;
  User.findById(userId)
    .orFail()
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        next(new BadRequestError('Переданы некорректные данные'));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError('Пользователь не найден.'));
      } else {
        next(err);
      }
    });
};

// аутентификация
module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
      res.send({ token });
    })
    .catch(next);
};
