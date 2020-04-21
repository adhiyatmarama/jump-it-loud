import React,{Component} from 'react';
import { StyleSheet, Text, View, StatusBar,TouchableOpacity ,Button, Image, KeyboardAvoidingView, Platform} from 'react-native';
import RNSoundLevel from 'react-native-sound-level'
import Constants from './gameSettings/constants'
import {GameEngine} from 'react-native-game-engine'
import Matter from 'matter-js'
import * as Permissions from 'expo-permissions'
import Character from './components/character'
import Physics, {
  resetObstacles
} from './gameSettings/physics'
import Floor from './components/floor'
import Background from './assets/background.png'
import HomeDiv from './pages/home'
import PauseButton from './assets/pause.png'
import HomeButton from './assets/btn-home2.png'
import ContinueButton from './assets/btn-continue.png'


export default class App extends Component {
  constructor(props){
    super(props)
    this.gameEngine = null;
    this.entities = this.setupWorld()
    this.state = {
      isRunning:false,
      score:0,
      gamePlayed: false,
      isPause:false,
      gameDone:false,
      pauseShow:false
    }
    this.startGame=this.startGame.bind(this)
  }

  async getPermission(){
    const {status, expires, permissions} = await Permissions.askAsync(Permissions.AUDIO_RECORDING)
    if (status !== 'granted'){
      alert('This Wonderful application need audio recording permission to run on your phone')
    }else {
      console.log('sukses')
      
    }
  }

  
  setupWorld = () =>{


    let engine = Matter.Engine.create({ enableSleeping:false})
    let world = engine.world;
    // console.log(world)

    let character = Matter.Bodies.rectangle(Constants.MAX_WIDTH / 4, Constants.MAX_HEIGHT-102, 50,50,{label:'character'})
    let floor  = Matter.Bodies.rectangle(Constants.MAX_WIDTH/2, Constants.MAX_HEIGHT - 50, Constants.MAX_WIDTH,50, {isStatic:true, label:'floor'})
    Matter.World.add(world, [character,floor]) 

    Matter.Events.on(engine,"collisionStart", event => {
      // console.log(event)
      let pairs = event.pairs
      let objA = pairs[0].bodyA.label
      let objB = pairs[0].bodyB.label
      // let objC = pairs[0].bodyC.label
      if(objA==='obstacle' && objB==='character'){
        // console.log(objA,objB,'nabrakcoy')
        this.gameEngine.dispatch({type:'gameOver'})
      }else if (objA==='character' && objB==='obstacle'){
        // console.log(objA,objB,'nabrakcoy2')
        this.gameEngine.dispatch({type:'gameOver'})
      }
    
    })

    return{
      physics: {engine, world, RNSoundLevel},
      character: {body:character, size:[50,50], pose:1, renderer: Character},
      floor: {body:floor, size:[Constants.MAX_WIDTH,50], color:"red", renderer: Floor},
    }


  }

  restartGame(){
    RNSoundLevel.start()
    
    this.setState({
      isRunning:true,
      score:0,
      gameDone:false
    })
    resetObstacles()
    this.gameEngine.swap(this.setupWorld())
  }

  componentWillUnmount(){
    RNSoundLevel.stop()
  }

  componentDidMount(){
    // RNSoundLevel.stop()
    RNSoundLevel.start()
    this.getPermission()
    console.log('mulai=============================')
    // this.setState({
    //   isRunning:true
    // })
    }
  startGame(){
    this.setState({
      isRunning: true,
      gamePlayed: true,
    })
  }

  onEvent = (e) =>{
    // console.log(e)
    if(e.type==='score'){
      this.setState({
        score:this.state.score+1
      })
      // console.log(this.state.score)
    }
    if(e.type==='gameOver'){
      console.log('gameOver',this.state.isPause,this.state.gameDone)
      this.setState({ 
        isRunning:false,
        gameDone:true,
        gamePlayed: false  
      })
      RNSoundLevel.stop()
    }
 
  }

  pause(){
    if(this.state.gameDone)
      return;

    console.log('Pause clicked',this.state.isPause,this.state.gameDone)
    this.setState({
      isPause:!this.state.isPause,
      isRunning:!this.state.isRunning
    })
  } 

  render(){
    return(
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS == "ios"? "padding" : "height"}>
        <Image source={Background} style={styles.background} resizeMode="stretch">
        </Image>  
        <GameEngine
          ref={(ref) => { this.gameEngine = ref}}
          style={styles.gameContainer}
          systems = {[Physics]}
          entities= {this.entities}
          running={this.state.isRunning}
          onEvent={this.onEvent}
        /> 
        <View style={{position:"absolute", top:30,left:30,bottom:0,right:0,flex:1,flexDirection:'row', justifyContent:'space-between'}}>
          <Text style={styles.scoreText}>{this.state.score}</Text>
          {
            (!this.state.isPause && this.state.isRunning) &&  
          <TouchableOpacity  onPress={()=>this.pause()}>
            <Image source={PauseButton} style={styles.pauseBtn} />
          </TouchableOpacity>
          }
         
        </View>
        {
          !this.state.isRunning && !this.state.gamePlayed &&
          <View style={styles.container}>
            <HomeDiv startGame={this.startGame}></HomeDiv>
          </View>
        }
        {
           this.state.gameDone && 
          <View style={styles.container}>
          <Button style={{width:100}} onPress={()=> this.restartGame()} title="restart"></Button>
          </View>
        }
        { 
           (this.state.isPause) &&
          <View style={styles.pauseScreen}>
            <View style={styles.pauseScreenContent}>
              {/* <Button title="continue" onPress={()=>this.pause()}/> */}
              <TouchableOpacity onPress={()=>this.pause()}>
                <Image source={ContinueButton} resizeMode="stretch" style={styles.customButton}></Image>
              </TouchableOpacity>
              <View style={{height:10}}/>
              <TouchableOpacity>
                <Image source={HomeButton} resizeMode="stretch" style={styles.customButton}></Image>
              </TouchableOpacity>
              {/* <Button title="Back To Menu" color="red"/> */}
            </View>
          </View>
        }
      </KeyboardAvoidingView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background:{
    position:"absolute",
    top:0,
    left:0,
    right:0,
    bottom:0,
    width:Constants.MAX_WIDTH,
    height:Constants.MAX_HEIGHT,
  },
  container2: {
    position:"absolute",
  },
  pauseBtn:{
    width:30,
    height:30,
    marginRight:20,
    top:20
  },
  scoreText:{
    fontSize:30
  },
  pauseScreen:{
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0, 
    right: 0,
    flex: 1,
  },
  pauseScreenContent:{
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  customButton:{
    width:120,
    height:45
  }
});
