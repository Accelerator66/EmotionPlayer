import { Injectable } from '@angular/core';
import { Media } from '@ionic-native/media';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';

@Injectable()
export class AudioService {
  public audioList: any = null;	// music list
  public audioPlaying: any;	// current loaded music
  public audioPlayingName: string = null;  // current loaded music name
  public audioPlayingIndex: number = null;  // current loaded music index
  public audioState: string;	// music state: playing, paused, stoped, released, loaded
  public audioRootPath: string; // path to store music
  constructor(private media: Media, private file: File, private plt: Platform, public events: Events){
    this.plt.ready().then(readySource => {
      // get local music path
      console.log("this");
      this.audioRootPath = this.file.applicationDirectory + 'www/assets/musics/';
      // get local music list
      console.log("this");
      this.loadList().then(() => {
        console.log("this");
        console.log(this.audioList);
        // broadcast
        console.log("this");
        this.songlistReady();
      });
    });
  }

  loadSongList(list: any){
    if(!list) console.log('Empty list in AudioService: loadSongList');
    else this.audioList = list;
  }

  loadSong(song: string, type: string){
    if(this.audioPlayingName != null) this.release();
    this.audioPlaying = this.media.create(this.file.applicationDirectory + 'www/assets/musics/' + song + "." + type);
    this.audioPlaying.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
    this.audioPlaying.onSuccess.subscribe(() => console.log(song + ' load successfully'));
    this.audioPlaying.onError.subscribe(error => console.log(song + ' load Error!', error));
    this.audioState = 'loaded';
    this.audioPlayingName = song;
    // get index of current playing music
    if(this.audioList != null){
      for(let i=0; i<this.audioList.length; i++){
        if(this.audioList[i].name == song){
          this.audioPlayingIndex = i;
          break;
        }
      }
    }

    // add event listener for songs
    this.audioPlaying.onStatusUpdate.subscribe(status => {
      //console.log(status);
      
      if(status === 0){ // null code
        this.audioState = null;
        console.log('Music state: null.');
        this.events.publish('AudioService:MusicNoPlaying');
      }
      else if(status === 1){  // loaded code
        this.audioState = 'loaded';
        console.log('Music state: loaded.');
        this.events.publish('AudioService:MusicNoPlaying');
      }
      else if(status === 2){  // running code
        this.audioState = 'playing';
        console.log('Music state: playing.');
        this.events.publish('AudioService:MusicPlaying');
      }
      else if(status === 3){  // pause code
        this.audioState = 'paused';
        console.log('Music state: paused.');
        this.events.publish('AudioService:MusicNoPlaying');
      }
      else if(status === 4){  // stop code
        this.audioState = 'stoped';
        console.log('Music state: stoped.');
        this.events.publish('AudioService:MusicNoPlaying');
      }

    });
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

  // music list ready event
  songlistReady(){
    console.log('Songlist is ready.')
    this.events.publish('AudioService:songlistReady');
  }

  loadList(){
    let that = this;
    return new Promise(function(resolve, reject){
      that.file.listDir(that.file.applicationDirectory, 'www/assets/musics').then(files => {
        that.audioList = [];
        for(let file of files){
          if(file.isDirectory == true){
            console.log("Folder name:" + file.name);
          }
          else if(file.isFile == true){
            console.log("File name:" + file.name);
            that.file.readAsArrayBuffer(that.file.applicationDirectory, 'www/assets/musics/' + file.name).then(rowData => {
              let info = that.musicFileDecoder(rowData);
              that.audioList.push({
                name: file.name.split(".")[0],
                type: file.name.split(".")[1],
                music_name: info.name,
                singer: info.singer,
                album: info.album
              });
            });
          }
        }
      });
    });
  }

  musicFileDecoder(rowData: any){
        let data = new Uint8Array(rowData);
        let id3_buffer_head = [];
        let id3_buffer_tagHead = [];
        let id3_head_length;

        let i;
        for(i=0; i<10; i++) {
          id3_buffer_tagHead.push(data[i]);
        }
        id3_head_length = (data[6]&0x7F)*0x200000 + (data[7]&0x7F)*0x4000 + (data[8]&0x7F)*0x80 + (data[9]&0x7F);
        for(i=0; i<id3_head_length; i++) {
          id3_buffer_head.push(data[i]);
        }

        i = 10;
        let music_name;
        let music_singer;
        let music_album;
        while(i<id3_head_length) {
          let temp_type = String.fromCharCode(id3_buffer_head[i]) + String.fromCharCode(id3_buffer_head[i+1]) + String.fromCharCode(id3_buffer_head[i+2]) + String.fromCharCode(id3_buffer_head[i+3]);
          let temp_length = id3_buffer_head[i+4]*0x100000000 + id3_buffer_head[i+5]*0x10000 + id3_buffer_head[i+6]*0x100 + id3_buffer_head[i+7];
          i += 10;
          let temp_info = data.slice(i+1, i+temp_length);
          i += temp_length;
          if(temp_type != "TIT2" && temp_type != "TPE1" && temp_type != "TALB") continue;
          let codeType1 = temp_info[0];
          let codeType2 = temp_info[1];
          let temp_info_str = null;
          if(codeType1 === 0xFF && codeType2 === 0xFE){
            temp_info_str = this.byteArrayToString(temp_info, 'utf-16le');
          }
          else if(codeType1 === 0xFE && codeType2 === 0xFF)
            temp_info_str = this.byteArrayToString(temp_info, 'utf-16be');
          else temp_info_str = this.byteArrayToString(temp_info, 'iso-8859-2');
          if(temp_type === "TIT2") music_name = temp_info_str;
          else if(temp_type === "TPE1") music_singer = temp_info_str;
          else if(temp_type === "TALB") music_album = temp_info_str;
        }
        let result = {
          name: music_name,
          singer: music_singer,
          album: music_album
        };
        return result;
  }

  byteArrayToString(bytes: any, codeset: string){
    let enc = new TextDecoder(codeset);
    let tmp =  enc.decode(bytes);
    console.log(tmp);
    return tmp;
  }

}