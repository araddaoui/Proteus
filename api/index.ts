import { createApp } from '../server/app.js';
import { assertRuntimeConfig } from '../server/config.js';

assertRuntimeConfig();

export default createApp();
