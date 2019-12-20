import React, { Component } from 'react'
import {
  SafeAreaView,
  Text,
  Alert,
  Platform,
  PermissionsAndroid,
  Button
} from 'react-native'
import codePush from 'react-native-code-push'
import Beacons from 'react-native-beacons-manager'
import { GoogleSignin } from 'react-native-google-signin'
import firebase from 'react-native-firebase'

async function googleLogin () {
  try {
    // add any configuration settings here:
    await GoogleSignin.configure({
      webClientId: '56658150283-v4ga3cbnniicuis9j3eil5uutiaafaol.apps.googleusercontent.com',
      forceConsentPrompt: true
    })

    try {
      const isSignedIn = await GoogleSignin.isSignedIn()
      console.log('1', isSignedIn)
      console.log('11')
      if (isSignedIn) {
        console.log('3')
        // await GoogleSignin.revokeAccess()
        await GoogleSignin.signOut()
        console.warn('2')
        await new Promise((resolve) => {
          setTimeout(() => resolve(), 2000)
        })
      }
    } catch (error) {
      console.warn(error)
    }

    const data = await GoogleSignin.signIn()

    console.log('!!!data', JSON.stringify(data))

    // create a new firebase credential with the token
    const credential = firebase.auth.GoogleAuthProvider.credential(data.idToken, data.accessToken)
    // login with credential
    const firebaseUserCredential = await firebase.auth().signInWithCredential(credential)

    console.warn(JSON.stringify(firebaseUserCredential.user.toJSON()))
  } catch (e) {
    console.warn(e)
  }
}

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

    if (Platform.OS === 'ios') {
      Beacons.requestWhenInUseAuthorization()

      Beacons.getAuthorizationStatus(status => {
        if (status === 'denied') {
          Alert.alert('不能偵測 Beacon', '手機沒有開放位置權限')
        }
      })
    }

    if (Platform.OS === 'android') {
      this.checkLocationPermission()
      Beacons.detectIBeacons()
    }

    Beacons
      .startRangingBeaconsInRegion(region)
      .then(() => console.log('Beacons ranging started succesfully'))
      .catch(error => console.log(`Beacons ranging not started, error: ${error}`))

    if (Platform.OS === 'ios') {
      this.beaconsDidRangeEvent = Beacons.BeaconsEventEmitter.addListener(
        'beaconsDidRange',
        ({ region: { identifier, uuid }, beacons }) => {
          // do here anything you need (ex: setting state...)
          console.log('beaconsDidRange these beacons: ', beacons)
        }
      )
    }

    if (Platform.OS === 'android') {
      this.beaconsDidRangeEvent = Beacons.BeaconsEventEmitter.addListener(
        'beaconsDidRange',
        (data) => {
          console.log('beaconsDidRange data: ', data)
        }
      )
    }

    this.unsubscriber = firebase.auth().onAuthStateChanged((user) => {
      Alert.alert(JSON.stringify(user))
    })
  }

  checkLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED || granted === true) {
      } else {
        this.requestLocationPermission()
      }
    } catch (err) {
      console.warn(err)
    }
  }

  // 註冊 Location 權限
  requestLocationPermission = async () => {
    try {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        {
          title: '申請權限',
          message:
            '申請權限',
          buttonNegative: 'NO',
          buttonPositive: 'OK'
        }
      )
    } catch (err) {
      console.warn(err)
    }
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

    if (this.unsubscriber) {
      this.unsubscriber()
    }
  }

  render () {
    return (
      <>
        <SafeAreaView>
          <Text>Code Push</Text>
          <Text>{this.state.progress}</Text>
          <Button title='googleLogin' onPress={googleLogin} />
        </SafeAreaView>
      </>
    )
  }
}

export default codePush(App)
