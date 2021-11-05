import * as request from 'supertest';

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
    const expectedResponse = { data: { hello: { ptBr: 'olar', en: 'Hello, World' } } };
    const response = await request('localhost:4001').post('/').send({ query });

    expect(response.statusCode).to.equal(200);
    expect(JSON.stringify(response.body)).to.equal(JSON.stringify(expectedResponse));
  });
});
