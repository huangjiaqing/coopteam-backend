import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_WORK_FACTOR = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;

const userSchema = new mongoose.Schema({
  username: {
    unique: true,
    required: true,
    type: String,
  },
  email: {
    unique: true,
    required: true,
    type: String,
  },
  password: {
    unique: true,
    type: String,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  role: {
    type: String,
    default: 'user',
  },
  lockUntil: Number,
  meta: {
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
});

userSchema.virtual('isLocked').get(() => !!(this.lockUntil && this.lockUntil > Data.now()));

userSchema.pre('save', next => {
  // if (this.isNew) {
  //   this.meta.createdAt = this.meta.updatedAt = Data.now();
  // } else {
  //   this.meta.updatedAt = Data.now();
  // }

  next();
});

userSchema.pre('save', next => {
  // if (!this.isModified('password')) return next();

  // bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
  //   if (err) return err;

  //   bcrypt.hash(this.password, salt, (error, hash) => {
  //     if (err) return next(err);

  //     this.password = hash;
  //     next();
  //   });
  // });
  next();
});

userSchema.methods = {

  comparePassword: (_password, password) => {
    return new Promise((resolve, reject) => {
      bcrypt.compare(_password, password, (err, isMatch) => {
        if (!err) return resolve(isMatch);
        else reject(err);
      });
    });
  },

  iscLoginAttepes: user => {
    return new Promise((resolve, reject) => {
      if (this.lockUntil && this.lockUntil < Date.now()) {
        this.update({
          $set: {
            loginAttempts: 1,
          },
          $unset: {
            lockUntil: 1,
          },
        }, err => {
          if (!err) resolve(true);
          else reject(err);
        });
      } else {
        let updates = {
          $inc: {
            loginAttempts: 1,
          }
        };

        if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
          updates.$set = {
            lockUntil: Date.now() + LOCK_TIME
          };
        }

        this.update(updates, err => {
          if (!err) resolve(true);
          else reject(err);
        });
      }
    });
  },

};

mongoose.model('User', userSchema);