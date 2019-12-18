import React, { Component } from 'react'
import {
  SafeAreaView,
  Text,
  Alert
} from 'react-native'
import codePush from 'react-native-code-push'

class App extends Component {
  state = {
    progress: ''
  }

  codePushStatusDidChange (status) {
    switch (status) {
      case codePush.SyncStatus.CHECKING_FOR_UPDATE:
        console.log('Checking for updates.')
        Alert.alert('Checking for updates.')
        break
      case codePush.SyncStatus.DOWNLOADING_PACKAGE:
        console.log('Downloading package.')
        Alert.alert('Downloading package.')
        break
      case codePush.SyncStatus.INSTALLING_UPDATE:
        console.log('Installing update.')
        Alert.alert('Installing update.')
        break
      case codePush.SyncStatus.UP_TO_DATE:
        console.log('Up-to-date.')
        Alert.alert('Up-to-date.')
        break
      case codePush.SyncStatus.UPDATE_INSTALLED:
        console.log('Update installed.')
        Alert.alert('Update installed.')
        break
    }
  }

  codePushDownloadDidProgress (progress) {
    this.setState({
      progress: `${progress.receivedBytes} of  ${progress.totalBytes} received.`
    })
  }

  render () {
    return (
      <>
        <SafeAreaView>
          <Text>Code Push</Text>
          <Text>{this.state.progress}</Text>
        </SafeAreaView>
      </>
    )
  }
}

export default codePush(App)
