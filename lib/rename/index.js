/* eslint-disable camelcase */

const cheerio = require('cheerio')
const colors = require('colors')
const fs = require('fs')
const replace = require('node-replace')
const shell = require('shelljs')
const path = require('path')
const { foldersAndFiles } = require('./config/foldersAndFiles')
const { filesToModifyContent } = require('./config/filesToModifyContent')
const { bundleIdentifiers } = require('./config/bundleIdentifiers')

const cwd = process.cwd()
const replaceOptions = {
  recursive: true,
  silent: true
}

function readFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

function replaceContent (regex, replacement, paths) {
  replace({
    regex,
    replacement,
    paths,
    ...replaceOptions
  })

  for (const filePath of paths) {
    console.log(`${filePath.replace(cwd, '')} ${colors.green('MODIFIED')}`)
  }
}

const deletePreviousBundleDirectory = ({ oldBundleNameDir, shouldDelete }) => {
  if (shouldDelete) {
    const dir = oldBundleNameDir.replace(/\./g, '/')
    const deleteDirectory = shell.rm('-rf', dir)
    Promise.resolve(deleteDirectory)
    console.log('Done removing previous bundle directory.'.green)
  } else {
    Promise.resolve()
    console.log('Bundle directory was not changed. Keeping...'.yellow)
  }
}

const cleanBuilds = () => {
  const deleteDirectories = shell.rm('-rf', [
    path.join(cwd, 'ios/build/*'),
    path.join(cwd, 'android/.gradle/*'),
    path.join(cwd, 'android/app/build/*'),
    path.join(cwd, 'android/build/*')
  ])
  Promise.resolve(deleteDirectories)
  console.log('Done removing builds.'.green)
}

module.exports = async (newName, bundleID) => {
  let data
  try {
    data = await readFile(path.join(cwd, 'android/app/src/main/res/values/strings.xml'))
  } catch (err) {
    if (err.code === 'ENOENT') return console.log('Directory should be created using "react-native init"')

    return console.log('Something went wrong: ', err)
  }

  // console.log('data', data, newName, bundleID, cwd)

  const $ = cheerio.load(data)
  const currentAppName = $('string[name=app_name]').text()
  const nS_CurrentAppName = currentAppName.replace(/\s/g, '')
  const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase()

  // console.log({ currentAppName, nS_CurrentAppName, lC_Ns_CurrentAppName })

  const nS_NewName = newName.replace(/\s/g, '')
  const pattern = /^([\p{Letter}\p{Number}])+([\p{Letter}\p{Number}\s]+)$/u
  const lC_Ns_NewAppName = nS_NewName.toLowerCase()

  // console.log({ nS_NewName, pattern, lC_Ns_NewAppName })

  bundleID = bundleID ? bundleID.toLowerCase() : null
  let newBundlePath
  const listOfFoldersAndFiles = foldersAndFiles(currentAppName, newName)
  const listOfFilesToModifyContent = filesToModifyContent(currentAppName, newName)

  // console.log({ bundleID, listOfFoldersAndFiles, listOfFilesToModifyContent })

  if (bundleID) {
    newBundlePath = bundleID.replace(/\./g, '/')
    const id = bundleID.split('.')
    if (id.length < 2) {
      return console.log('Invalid Bundle Identifier. Add something like "com.travelapp" or "com.junedomingo.travelapp"')
    }
  }

  if (!pattern.test(newName)) {
    return console.log(`"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`)
  }

  if (newName === currentAppName || newName === nS_CurrentAppName || newName === lC_Ns_CurrentAppName) {
    return console.log('Please try a different name.')
  }

  // console.log({
  //   newName,
  //   currentAppName,
  //   nS_CurrentAppName,
  //   lC_Ns_CurrentAppName
  // })

  // Move files and folders from ./config/foldersAndFiles.js
  const resolveFoldersAndFiles = new Promise(resolve => {
    listOfFoldersAndFiles.forEach((element, index) => {
      const dest = element.replace(new RegExp(nS_CurrentAppName, 'i'), nS_NewName)
      let itemsProcessed = 1
      const successMsg = `/${dest} ${colors.green('RENAMED')}`

      setTimeout(() => {
        itemsProcessed += index

        if (fs.existsSync(path.join(cwd, element)) || !fs.existsSync(path.join(cwd, element))) {
          const move = shell.exec(
            `git mv "${path.join(cwd, element)}" "${path.join(cwd, dest)}" 2>/dev/null`
          )

          if (move.code === 0) {
            console.log(successMsg)
          } else if (move.code === 128) {
            // if "outside repository" error occured
            if (shell.mv('-f', path.join(cwd, element), path.join(cwd, dest)).code === 0) {
              console.log(successMsg)
            } else {
              console.log("Ignore above error if this file doesn't exist")
            }
          }
        }

        if (itemsProcessed === listOfFoldersAndFiles.length) {
          resolve()
        }
      }, 200 * index)
    })
  })

  // Modify file content from ./config/filesToModifyContent.js
  const resolveFilesToModifyContent = () => new Promise(resolve => {
    let filePathsCount = 0
    let itemsProcessed = 0
    listOfFilesToModifyContent.map(file => {
      filePathsCount += file.paths.length

      file.paths.map((filePath, index) => {
        const newPaths = []

        setTimeout(() => {
          itemsProcessed++
          if (fs.existsSync(path.join(cwd, filePath))) {
            newPaths.push(path.join(cwd, filePath))
            replaceContent(file.regex, file.replacement, newPaths)
          }
          if (itemsProcessed === filePathsCount) {
            resolve()
          }
        }, 200 * index)
      })
    })
  })

  const resolveJavaFiles = () => new Promise(resolve => {
    readFile(path.join(cwd, 'android/app/src/main/AndroidManifest.xml')).then(data => {
      const $ = cheerio.load(data)
      const currentBundleID = $('manifest').attr('package')
      const newBundleID = bundleID || `com.${lC_Ns_NewAppName}`
      const javaFileBase = '/android/app/src/main/java'
      const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`
      const currentJavaPath = `${javaFileBase}/${currentBundleID.replace(/\./g, '/')}`

      if (bundleID) {
        newBundlePath = newJavaPath
      } else {
        newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase()
        newBundlePath = `${javaFileBase}/${newBundlePath}`
      }

      const fullCurrentBundlePath = path.join(cwd, currentJavaPath)
      const fullNewBundlePath = path.join(cwd, newBundlePath)

      // Create new bundle folder if doesn't exist yet
      if (!fs.existsSync(fullNewBundlePath)) {
        shell.mkdir('-p', fullNewBundlePath)
        const move = shell.exec(`git mv "${fullCurrentBundlePath}/"* "${fullNewBundlePath}" 2>/dev/null`)
        const successMsg = `${newBundlePath} ${colors.green('BUNDLE INDENTIFIER CHANGED')}`

        if (move.code === 0) {
          console.log(successMsg)
        } else if (move.code === 128) {
          // if "outside repository" error occured
          if (shell.mv('-f', fullCurrentBundlePath + '/*', fullNewBundlePath).code === 0) {
            console.log(successMsg)
          } else {
            console.log(`Error moving: "${currentJavaPath}" "${newBundlePath}"`)
          }
        }
      }

      const vars = {
        currentBundleID,
        newBundleID,
        newBundlePath,
        javaFileBase,
        currentJavaPath,
        newJavaPath
      }
      resolve(vars)
    })
  })

  const resolveBundleIdentifiers = params => new Promise(resolve => {
    let filePathsCount = 0
    const { currentBundleID, newBundleID, newBundlePath, javaFileBase, currentJavaPath, newJavaPath } = params

    bundleIdentifiers(
      currentAppName,
      newName,
      currentBundleID,
      newBundleID,
      newBundlePath
    ).map(file => {
      filePathsCount += file.paths.length - 1
      let itemsProcessed = 0

      file.paths.map((filePath, index) => {
        const newPaths = []
        if (fs.existsSync(path.join(cwd, filePath))) {
          newPaths.push(path.join(cwd, filePath))

          setTimeout(() => {
            itemsProcessed += index
            replaceContent(file.regex, file.replacement, newPaths)
            if (itemsProcessed === filePathsCount) {
              const oldBundleNameDir = path.join(cwd, javaFileBase, currentBundleID)
              resolve({ oldBundleNameDir, shouldDelete: currentJavaPath !== newJavaPath })
            }
          }, 200 * index)
        }
      })
    })
  })

  const rename = () => {
    resolveFoldersAndFiles
      .then(resolveFilesToModifyContent)
      .then(resolveJavaFiles)
      .then(resolveBundleIdentifiers)
      .then(deletePreviousBundleDirectory)
      .then(cleanBuilds)
      .then(() => console.log(`APP SUCCESSFULLY RENAMED TO "${newName}"! 🎉 🎉 🎉`.green))
      .then(() => {
        if (fs.existsSync(path.join(cwd, 'ios', 'Podfile'))) {
          console.log(
            `${colors.yellow('Podfile has been modified, please run "pod install" inside ios directory.')}`
          )
        }
      })
      .then(() =>
        console.log(
          `${colors.yellow(
            'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app. '
          )}`
        )
      )
  }

  await rename()
}