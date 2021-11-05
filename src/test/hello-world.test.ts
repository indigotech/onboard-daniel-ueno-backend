import { setup } from '../setup';
const request = require('supertest');

// before(() => {
//   setup();
// });

describe('Hello-World', function () {
  describe('hello-world test', function () {
    it('hello-world response', function (done) {
      //meu teste aqui
      const query = `
      query
        hello {
          hello {
            ptBr
            en
          }
        }`;

      request('localhost:4001')
        .post('/')
        .send(query)
        .expect(200)
        .end(function (err) {
          if (err) return done(err);
          return done();
        });
    });
  });
});