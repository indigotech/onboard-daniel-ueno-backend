import { getRepository } from 'typeorm';
import { generateSeed } from '../seed';
import { setup } from '../setup';

before(async () => {
  await generateSeed();
  await setup();
});
after(async () => {
  await getRepository('User').clear();
});

// require('./hello-world.test');
// require('./create-user.test');
// require('./user-query.test');
// require('./login.test');
require('./users-query.test');
