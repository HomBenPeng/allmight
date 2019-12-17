#!/usr/bin/env node

const { spawn } = require('child_process')
const symlinkDir = require('symlink-dir')
const path = require('path')
const fs = require('fs-extra')

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

const start = async () => {
  try {
    await fs.remove(path.join(__dirname, '..', 'src'))
  } catch (err) {
    console.error(err)
  }

  try {
    await symlinkDir(
      path.join(process.cwd(), 'src'),
      path.join(__dirname, '..', 'src')
    )
  } catch (err) {
    console.error(err)
  }

  await yarnRun('start')
}

start()

process.on('unhandledRejection', async err => {
  console.error('Unhandled rejection', err)
  process.exit(1)
})

process.on('uncaughtException', async err => {
  console.error('Uncaught exception', err)
  process.exit(1)
})
