process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo-test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';

const chai = require('chai');
const mongoose = require('mongoose');
const request = require('supertest');
const User = require('../models/User');
const { app, connectDB } = require('../app');

const expect = chai.expect;

describe('User Registration', () => {
  before(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .type('form')
      .send({
        username: 'peace',
        password: 'mypassword'
      });

    expect(res.status).to.equal(302);

    const user = await User.findOne({ username: 'peace' });
    expect(user).to.not.be.null;
    expect(user.username).to.equal('peace');
  });

  it('should reject a short password', async () => {
    const res = await request(app)
      .post('/register')
      .type('form')
      .send({
        username: 'peace',
        password: '123'
      });

    expect(res.status).to.equal(400);

    const user = await User.findOne({ username: 'peace' });
    expect(user).to.be.null;
  });
});
