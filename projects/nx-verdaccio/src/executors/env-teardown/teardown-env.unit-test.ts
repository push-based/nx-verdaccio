import { describe, expect, it, vi } from 'vitest';
import { teardownEnvironment } from './bootstrap-env';
import * as verdaccioRegistryModule from './verdaccio-registry';
import * as npmModule from './npm';
import * as fs from 'node:fs/promises';
