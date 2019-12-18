#!/usr/bin/env node

const { spawn } = require('child_process')
const arg = require('arg')

const yarnRun = async (scriptName) => {
  return new Promise((resolve, reject) => {
    const stream = spawn(
      process.platform === 'win32' ? 'yarn.cmd' : 'yarn',
      ['run', scriptName],
      {
        cwd: __dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          CWD: process.cwd()
        }
      }
    )

    stream.on('close', code => {
      resolve()
    })

    stream.on('error', err => {
      console.log(`yarnRun ${scriptName} error`, err)
      reject(err)
    })

    stream.on('exit', code => {
      console.log(`yarnRun ${scriptName} exit code`, code)
      if (code !== 0) {
        reject(new Error(`yarnRun ${scriptName} exit code error`))
      }
    })
  })
}

const start = async () => yarnRun('start')
const ios = async () => yarnRun('ios')
const android = async () => yarnRun('android')

const args = arg({}, { permissive: true })
console.log(args)

let command = 'start'
if (args._.length) {
  command = args._[0]
  if (command === 'start') {
    start()
  } else if (command === 'ios') {
    ios()
  } else if (command === 'android') {
    android()
  } else {
    throw new Error('unknown allmight command.')
  }
} else {
  start()
}

process.on('unhandledRejection', async err => {
  console.error('Unhandled rejection', err)
  process.exit(1)
})

process.on('uncaughtException', async err => {
  console.error('Uncaught exception', err)
  process.exit(1)
})
