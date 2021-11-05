import { setup } from '../setup';
const request = require('supertest');

before(() => {
  setup();
});

describe('Hello-World', function () {
  describe('hello-world test', function () {
    it('hello-world response', async function () {
      //meu teste aqui
      const query = `
      query
        hello {
          hello {
            ptBr
            en
          }
        }`;

      await request('localhost:4001')
        .post('/')
        .send({ query })
        .expect(200)
        .expect({ data: { hello: { ptBr: 'olar', en: 'Hello, World' } } });
    });
  });
});
