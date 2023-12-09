import { Track } from "./track.js"

function loadTrack(num){
    console.log("LOADING TRACK " + num)
    //where the track is loaded
    var track = new Track("Track " + String(num), 1, "../../res/tracks/track"+String(num)+".txt")
    track.build(scene, world)
    var checkpoints = track.getCheckpoints() //list of all checkpoints in the order that the player will see them. start with staring line
}  