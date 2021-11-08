import { setup } from '../setup';

before(() => {
  setup();
});

require('./hello-world.test');
