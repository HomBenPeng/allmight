#!/usr/bin/env node

const { spawn } = require('child_process')
const arg = require('arg')
const symlinkDir = require('symlink-dir')
const path = require('path')
const fs = require('fs-extra')
const rename = require('../lib/rename')

const yarnRun = async (scriptName, extraArgs = []) => {
  return new Promise((resolve, reject) => {
    const stream = spawn(
      process.platform === 'win32' ? 'yarn.cmd' : 'yarn',
      ['run', scriptName, ...extraArgs],
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

const start = async (args) => yarnRun('start', args)
const ios = async (args) => yarnRun('ios', args)
const android = async (args) => yarnRun('android', args)
const openIOS = async (args) => yarnRun('open-ios', args)

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
  if (fs.existsSync(path.join(__dirname, '..', '..', '..', 'node_modules'))) {
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
  }

  let command = 'start'
  if (args._.length) {
    command = args._[0]
    if (command === 'start') {
      start(args._.slice(1))
    } else if (command === 'ios') {
      hackPackagerSh()
      ios(args._.slice(1))
    } else if (command === 'android') {
      hackPackagerSh()
      android(args._.slice(1))
    } else if (command === 'open-ios') {
      openIOS(args._.slice(1))
    } else if (command === 'rename') {
      await rename(...args._.slice(1))
      yarnRun('postrename')
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
