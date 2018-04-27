import { Injectable } from '@angular/core';
import { Media } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';

@Injectable()
export class AudioService {
  public audioList: any;	// music list
  public audioPlaying: any;	// current loaded music
  public audioPlayingName: string = null;  // current loaded music name
  public audioState: string;	// music state: playing, paused, stoped, released, loaded
  public audioRootPath: string;
  constructor(private media: Media, private file: File, private plt: Platform){
    this.plt.ready().then(readySource => {
      this.audioRootPath = this.file.applicationDirectory + 'www/assets/musics/';
    });
  }

  loadSongList(list: any){
    if(!list) console.log('Empty list in AudioService: loadSongList');
    else this.audioList = list;
  }

  loadSong(song: string){
    if(this.audioPlayingName) this.release();
    this.audioPlaying = this.media.create(this.file.applicationDirectory + 'www/assets/musics/' + song);
    this.audioPlaying.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
    this.audioPlaying.onSuccess.subscribe(() => console.log(song + ' load successfully'));
    this.audioPlaying.onError.subscribe(error => console.log(song + ' load Error!', error));
    this.audioState = 'loaded';
    this.audioPlayingName = song;
  }

  isCurrent(song: string){
    if(song === this.audioPlayingName) return true;
    else return false;
  }

  play(){
  	if(!this.audioPlaying){
  		console.log('No music to play.');
  	}
  	else{
  		this.audioPlaying.play();
      this.audioState = 'playing';
  	}
  }

  pause(){
  	if(this.audioPlaying){
  		this.audioPlaying.pause();
      this.audioState = 'paused';
  	}
  	else{
  		console.log('No music to pause.');
  	}
  }

  stop(){
    if(this.audioPlaying){
      this.audioPlaying.stop();
      this.audioState = 'stoped';
    }
    else{
      console.log('No music to stop.');
    }
  }

  release(){
    if(this.audioPlaying){
      this.audioPlaying.release();
      this.audioState = 'released';
      this.audioPlayingName = null;
    }
    else{
      console.log('No music to release.');
    }
  }

}