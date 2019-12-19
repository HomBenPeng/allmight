#!/usr/bin/env node

const { spawn } = require('child_process')
const arg = require('arg')
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

const start = async () => yarnRun('start')
const ios = async () => yarnRun('ios')
const android = async () => yarnRun('android')

const hackPackagerSh = () => {
  const nodeModulesPath = path.join(__dirname, '..', '..', '..', 'node_modules')
  const shPath = path.join(nodeModulesPath, 'react-native', 'scripts', 'packager.sh')
  if (fs.existsSync(nodeModulesPath)) {
    let data = fs.readFileSync(shPath, 'utf-8')
    data = data.replace('cd "$PROJECT_ROOT" || exit', 'cd "$PROJECT_ROOT/node_modules/allmight" || exit')
    fs.writeFileSync(shPath, data, 'utf-8')
  }
}

const args = arg({}, { permissive: true })
console.log(args)

const init = async () => {
  try {
    await fs.remove(path.join(__dirname, '..', 'node_modules'))
  } catch (err) {
    console.error(err)
  }

  try {
    await symlinkDir(
      path.join(process.cwd(), 'node_modules'),
      path.join(__dirname, '..', 'node_modules')
    )
  } catch (err) {
    console.error(err)
  }

  let command = 'start'
  if (args._.length) {
    command = args._[0]
    if (command === 'start') {
      start()
    } else if (command === 'ios') {
      hackPackagerSh()
      ios()
    } else if (command === 'android') {
      hackPackagerSh()
      android()
    } else {
      throw new Error('unknown allmight command.')
    }
  } else {
    start()
  }
}

init()

process.on('unhandledRejection', async err => {
  console.error('Unhandled rejection', err)
  process.exit(1)
})

process.on('uncaughtException', async err => {
  console.error('Uncaught exception', err)
  process.exit(1)
})
