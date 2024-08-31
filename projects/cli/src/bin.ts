#! /usr/bin/env node
import {hideBin} from 'yargs/helpers';
import {cli} from './lib/cli';

// bootstrap Yargs, parse arguments and execute command
cli(hideBin(process.argv)).argv;
