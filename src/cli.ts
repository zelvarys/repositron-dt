#!/usr/bin/env node
import meow from 'meow'

const cli = meow(
  `
  Usage
    $ repositron

  Options
    --help     Show this help
    --version  Show the version

  Repositron is an interactive terminal dashboard for GitHub repositories.
`,
  { importMeta: import.meta },
)

console.log(`Repositron ${cli.pkg.version}`)
