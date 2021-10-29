import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { User } from './entity/User';

createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'testando123',
  password: 'senha123',
  database: 'database123',
  entities: [User],
  synchronize: true,
  logging: false,
})
  .then(async (connection) => {
    const user = new User();
    user.firstName = 'Daniel';
    user.lastName = 'Ueno';
    user.age = 32;
    console.log(`testando aqui, usuario: ${user.firstName} ${user.lastName}, ${user.age} anos`);
    return connection.manager.save(user).then((user) => console.log(`uhul!, id: ${user.id}`));
  })
  .catch((error) => console.log(error));
