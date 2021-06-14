#!/usr/bin/env -S deno run --unstable --allow-read --allow-run

import * as log from 'https://deno.land/std@0.97.0/log/mod.ts';
import { basename } from 'https://deno.land/std@0.97.0/path/mod.ts';
import Ask from 'https://deno.land/x/ask@1.0.6/mod.ts';
import Denomander from 'https://deno.land/x/denomander@0.8.2/mod.ts';
import * as semver from 'https://deno.land/x/semver@v1.4.0/mod.ts';

const VERSION = JSON.parse(await Deno.readTextFile('./package.json')).version;

const program = new Denomander({
  app_name: basename(import.meta.url),
  app_version: VERSION,
  app_description: 'A couple of scripts that revolve around the project.'
});

/**
 * The publish workflow in a nutshell:
 *  - git commit -S -m ":bookmark: $VERSION."
 *  - yarn version --new-version $VERSION --message "[release] $VERSION"
 *  - git tag v$VERSION
 *  - git push origin refs/tags/v$VERSION
 *  - git push
 *  - yarn publish --new-version $VERSION --access public
 */
program.command('publish', 'Publishes the package.').action(async () => {
  const ask = new Ask();

  const { version } = await ask.input({
    name: 'version',
    message: 'Please enter the release version:',
    default: semver.inc(VERSION, 'patch') ?? undefined
  });

  if (!version) {
    return;
  }

  const cleanVersion = semver.clean(version);

  if (!cleanVersion || !semver.valid(cleanVersion)) {
    throw new Error(`The version provided isn't semver valid.`);
  }

  const { proceed } = await ask.input({
    name: 'proceed',
    message: `Releasing ${cleanVersion} - are you sure? (y/n)`
  });

  if (!proceed || !/^y(.+)?/gi.test(proceed)) {
    log.warning('Aborting.');
    return;
  }

  log.info(`Releasing ${cleanVersion}...`);

  log.info('Committing the version.');
  const commitStatus = await Deno.run({
    cmd: ['git', 'commit', '-S', '-m', `:bookmark: ${cleanVersion}.`]
  }).status();

  if (!commitStatus.success) {
    log.error('Commit failed.');
    return;
  }

  log.info('Registering the version.');
  const createVersionStatus = await Deno.run({
    cmd: [
      'yarn',
      'version',
      '--new-version',
      cleanVersion,
      '--message',
      `:bookmark: [release] ${cleanVersion}.`
    ]
  }).status();

  if (!createVersionStatus.success) {
    log.error('Creating a new version failed.');
    return;
  }

  log.info('Creating a tag for the version.');
  const createTagStatus = await Deno.run({
    cmd: ['git', 'tag', `v${cleanVersion}`]
  }).status();

  if (!createTagStatus.success) {
    log.error('Creating a tag for the new version failed.');
    return;
  }

  log.info('Pushing tag to the repository.');
  const pushTagStatus = await Deno.run({
    cmd: ['git', 'push', 'origin', `refs/tags/v${cleanVersion}`]
  }).status();

  if (!pushTagStatus.success) {
    log.error('Pushing the tag failed.');
    return;
  }

  log.info('Pushing all the stuff to the repository (if any).');
  await Deno.run({ cmd: ['git', 'push'] }).status();

  log.info('Publishing the version.');
  const publishStatus = await Deno.run({
    cmd: [
      'yarn',
      'publish',
      '--new-version',
      cleanVersion,
      '--access',
      'public'
    ]
  }).status();

  if (!publishStatus.success) {
    log.error('Publishing failed.');
    return;
  }

  log.info(`Succesfully published ${cleanVersion} 🎉`);
});

program.parse(Deno.args);
