import React, { Component } from 'react'
import {
  SafeAreaView,
  Text,
  Alert
} from 'react-native'
import codePush from 'react-native-code-push'
import Beacons from 'react-native-beacons-manager'

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

  componentDidMount () {
    const region = {
      identifier: '',
      uuid: 'b5b182c7-eab1-4988-aa99-b5c1517008d9'
    }

    Beacons.requestWhenInUseAuthorization()

    Beacons.getAuthorizationStatus(status => {
      if (status === 'denied') {
        Alert.alert('不能偵測 Beacon', '手機沒有開放位置權限')
      }
    })

    Beacons
      .startRangingBeaconsInRegion(region)
      .then(() => console.log('Beacons ranging started succesfully'))
      .catch(error => console.log(`Beacons ranging not started, error: ${error}`))

    this.beaconsDidRangeEvent = Beacons.BeaconsEventEmitter.addListener(
      'beaconsDidRange',
      ({ region: { identifier, uuid }, beacons }) => {
        // do here anything you need (ex: setting state...)
        console.log('beaconsDidRange these beacons: ', beacons)
      }
    )
  }

  componentWillUnMount () {
    const region = {
      identifier: 'Estimotes',
      uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
    }

    Beacons
      .stopRangingBeaconsInRegion(region)
      .then(() => console.log('Beacons ranging stopped succesfully'))
      .catch(error => console.log(`Beacons ranging not stopped, error: ${error}`))

    // remove beacons event we registered at componentDidMount
    if (this.beaconsDidRangeEvent) {
      this.beaconsDidRangeEvent.remove()
    }
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
