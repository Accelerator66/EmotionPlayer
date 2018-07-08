import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http';

@Injectable()
export class AudioService {
  public userData: any = null;  // local user information
  public audioSongs: any = null;  // local musics
  public audioLists: any = null; // music list
  public isAusioListsLoaded: boolean = false;
  public audioListPlaying: any = null;	// current music list
  public audioListMode: string = "single";  // list play mode: 'single', 'order', 'random'
  public audioPlaying: any = null;  // current loaded music
  public audioState: string = "released";	// music state: playing, paused, stoped, released, loaded
  public valence: number = 0;
  public arousal: number = 0;
  public isEmotionSonglistCreated: boolean = false;
  public serverAddress: string = "http://192.168.0.42:3000/";
  public serverSongRoot: string = "song/";
  public serverAlbumRoot: string = "album/";
  public serverSingerRoot: string = "singer/";
  constructor(private file: File,
              public plt: Platform,
              public events: Events,
              private storage: Storage,
              private http: HTTP){
    
  }

  servicePrepare(){
      // get local music list
      this.audioLists = this.userData.localsonglists;
      this.isAusioListsLoaded = true;
      // broadcast
      console.log('Songlist is ready.')
      this.events.publish('AudioService:songlistReady');
  }

  // set current songlist by list id
  loadSongList(listid: string){
    if(this.audioListPlaying != null && this.audioListPlaying.id == listid) return;
    console.log('Load songlist:' + listid);
    let index = this.getSonglistById(listid);
    if(index == -1) return;
    this.audioListPlaying = this.audioLists[index];
  }

  loadSong(songid: number){
    if(this.audioListPlaying == null) return -2;
    let listindex = this.getSonglistById(this.audioListPlaying.id);
    if(listindex == -1) return -2;
    let songindex = this.getSongById(listindex, songid);
    if(songindex == -1) return -2;
    if(this.audioPlaying != null){
      if(this.audioPlaying.id == songid) return -1;
      this.release();
    }
    this.audioState = 'loaded';
    this.audioPlaying = this.audioListPlaying.songs[songindex];
    return 0;
  }

  isCurrent(listid: string, songid: number){
    if(this.audioPlaying == null) return false;
    if(this.audioListPlaying == null) return false;
    if(listid != this.audioListPlaying.id) return false;
    if(songid != this.audioPlaying.id) return false;
    return true;
  }

  play(songid: number){
    let r = this.loadSong(songid);
    if(r == -2) return;
  	if(r == -1){
  		this.audioState = 'playing';
      this.events.publish('AudioService:MusicStatePlaying');
  	}
  	else if(r == 0){
      let src = this.audioPlaying.mp3Url;
      let albumSrc = this.audioPlaying.album.picUrl;
      console.log("prepare to send MusicStatePlaying.");
      this.audioState = 'playing';
      this.events.publish('AudioService:MusicStatePlaying', this.serverAddress + this.serverSongRoot + src);
      this.events.publish('AudioService:SongChanged', albumSrc);
  	}
  }

  pause(){
  	if(this.audioPlaying){
      this.audioState = 'paused';
      this.events.publish('AudioService:MusicStatePaused');
  	}
  	else{
  		console.log('No music to pause.');
  	}
  }

  stop(){
    if(this.audioPlaying){
      this.audioState = 'stoped';
      this.events.publish('AudioService:MusicStateStoped');
    }
    else{
      console.log('No music to stop.');
    }
  }

  release(){
    if(this.audioPlaying){
      this.audioState = 'released';
      this.audioPlaying = null;
      this.events.publish('AudioService:MusicStateNull');
    }
    else{
      console.log('No music to release.');
    }
  }

  nextSong(){
    if(this.audioListMode == 'single'){
      if(this.audioPlaying) this.play(this.audioPlaying.id);
    }
    else if(this.audioListMode == 'order'){
      this.nextSongOrdered();
    }
    else if(this.audioListMode == 'random'){
      this.nextSongRandomed();
    }
    let albumSrc = this.audioPlaying.album.picUrl;
    this.events.publish('AudioService:SongChanged', albumSrc);
  }

  nextSongOrdered(){
    if(!this.audioListPlaying || !this.audioPlaying) return;
    let listindex = this.getSonglistById(this.audioListPlaying.id);
    if(listindex == -1) return;
    let songindex = this.getSongById(listindex, this.audioPlaying.id);
    if(songindex == -1) return;
    let listsz = this.audioListPlaying.songs.length;
    if(listsz == 0) return;
    this.audioPlaying = this.audioListPlaying.songs[(songindex + 1) % listsz];
    this.audioState = 'loaded';
    let src = this.audioPlaying.mp3Url;
    this.events.publish('AudioService:MusicStatePlaying', this.serverAddress + this.serverSongRoot + src);
  }

  nextSongRandomed(){
    if(!this.audioListPlaying || !this.audioPlaying) return;
    let listsz = this.audioListPlaying.songs.length;
    if(listsz == 0) return;
    let nextindex = Math.trunc(Math.random() * listsz);
    this.audioPlaying = this.audioListPlaying.songs[nextindex % listsz];
    this.audioState = 'loaded';
    let src = this.audioPlaying.mp3Url;
    this.events.publish('AudioService:MusicStatePlaying', this.serverAddress + this.serverSongRoot + src);
  }

  addSonglist(name: string, username: string){
    let that = this;
    return new Promise(function(resolve, reject){
      let url = that.serverAddress + 'songlistOp/addlist?username=' + username + '&name=' + name;
      that.http.get(url, {}, {}).then(data => {
          console.log(data.status);
          let id = JSON.parse(data.data.toString()).id;
          // update local songlist
          that.audioLists.push(that.createSonglist(id, name));
          that.userData.localsonglists = that.audioLists;
          that.storage.set(username, that.userData).then(function(){
              console.log("local songlist add: " + name);
              resolve();
          }).catch(function(){
              reject("local songlist add failed.");
          });
      }).catch(error => {
          console.log(error.status);
          console.log(error.error);
          console.log(error.headers);
          var result = [];
          reject(error.error);
      });  
    });
  }

  deleteSonglist(listid: string, username: string){
    let that = this;
    return new Promise(function(resolve, reject){
      let url = that.serverAddress + 'songlistOp/deletelist?username=' + username + '&listid=' + listid;
      that.http.get(url, {}, {}).then(data => {
          console.log(data.status);
          let state = JSON.parse(data.data.toString()).state;
          if(state == 0) reject("remote songlist delete failed.");
          // update local songlist
          that.dropSonglist(listid);
          that.userData.localsonglists = that.audioLists;
          that.storage.set(username, that.userData).then(function(){
              console.log("local songlist delete: " + listid);
              resolve();
          }).catch(function(){
              reject("local songlist delete failed.");
          });
      }).catch(error => {
          console.log(error.status);
          console.log(error.error);
          console.log(error.headers);
          reject(error.error);
      });  
    });
  }

  addSongToSonglist(listid: string, songid: number, username: string, song: any){
    let that = this;
    return new Promise(function(resolve, reject){
      let url = that.serverAddress + 'songlistOp/addsong?username=' + username + '&listid=' + listid + '&songid=' + songid.toString() + '&songbody=' + JSON.stringify(song);
      that.http.get(url, {}, {}).then(data => {
          console.log(data.status);
          let response = JSON.parse(data.data.toString());
          if(response.state == 0) reject("add song to remote songlist failed: no such song.");
          else if(response.state == 2){
            reject("add repeated song to remote songlist.");
          }
          else{
            // update local songlist
            that.addSong(listid, song);
            that.userData.localsonglists = that.audioLists;
            that.storage.set(username, that.userData).then(function(){
                console.log("add song to local songlist: " + listid);
                resolve();
            }).catch(function(){
                reject("add song to local songlist failed.");
            });
          }
      }).catch(error => {
          console.log(error.status);
          console.log(error.error);
          console.log(error.headers);
          reject(error.error);
      });
    });
  }

  deleteSongFromSonglist(listid: string, songid: number, username: string){
    let that = this;
    return new Promise(function(resolve, reject){
      let url = that.serverAddress + 'songlistOp/deletesong?username=' + username + '&listid=' + listid + '&songid=' + songid.toString();
      that.http.get(url, {}, {}).then(data => {
          console.log(data.status);
          let response = JSON.parse(data.data.toString());
          if(response.state == 0) reject("delete song from remote songlist failed.");
          // update local songlist
          that.deleteSong(listid, songid);
          that.userData.localsonglists = that.audioLists;
          that.storage.set(username, that.userData).then(function(){
              console.log("delete song from local songlist: " + listid);
              resolve();
          }).catch(function(){
              reject("delete song from local songlist failed.");
          });
      }).catch(error => {
          console.log(error.status);
          console.log(error.error);
          console.log(error.headers);
          reject(error.error);
      });
    });
  }

  createSonglist(id: string, name: string){
    let t ={
      id: id,
      name: name,
      songs: []
    };
    return t;
  }

  createEmotionSonglist(){
    let happyList = {
      id: "happy",
      name: "肥宅快乐歌单",
      songs: []
    };
    let sadList = {
      id: "sad",
      name: "猛男落泪歌单",
      songs: []
    };
    let isIn = function(ele: any, array: any){
      let flag = 0;
      for(let i=0; i<array.length; i++){
        if(ele.id == array[i].id){
          flag = 1;
          break;
        }
      }
      if(flag == 1) return true;
      else return false;
    }
    for(let i=0; i<this.audioLists.length; i++){
      let curlist = this.audioLists[i];
      for(let j=0; j<curlist.songs.length; j++){
        if(curlist.songs[j].valence > 0 && !isIn(curlist.songs[j], happyList.songs)){
          happyList.songs.push(curlist.songs[j]);
        }
        else if(curlist.songs[j].valence <= 0 && !isIn(curlist.songs[j], sadList.songs)){
          sadList.songs.push(curlist.songs[j]);
        }
      }
    }
    if(isIn(happyList, this.audioLists)){
      let index = this.getSonglistById(happyList.id);
      this.audioLists[index].songs = happyList.songs;
    }
    else{
      this.audioLists.push(happyList);
    }
    if(isIn(sadList, this.audioLists)){
      let index = this.getSonglistById(sadList.id);
      this.audioLists[index].songs = sadList.songs;
    }
    else{
      this.audioLists.push(sadList);
    }
    this.isEmotionSonglistCreated = true;
  }

  // source: "local", "remote"
  createSong(remoteParam: any, source: string){
    let t = {
      id: remoteParam.id,
      name: remoteParam.name,
      album: {
        id: remoteParam.album.id,
        name: remoteParam.album.name,
        picUrl: remoteParam.album.picUrl
      },
      duration: remoteParam.duration,
      artist: {
        id: remoteParam.artist.id,
        name: remoteParam.artist.name,
        picUrl: remoteParam.artist.picUrl,
        img1v1Url: remoteParam.artist.img1v1Url
      },
      mp3Url: remoteParam.mp3Url,
      valence: remoteParam.valence,
      arousal: remoteParam.arousal,
      source: source
    };
    return t;
  }

  getSonglistById(id: string){
    let flag = false;
    let i = 0;
    for(; i<this.audioLists.length; i++){
      if(id == this.audioLists[i].id){
        flag = true;
        break;
      }
    }
    if(flag) return i;
    else return -1;
  }

  getSongById(listindex: number, id: number){
    if(listindex < 0 || listindex >= this.audioLists.length) return -1;
    let flag = false;
    let i = 0;
    for(; i<this.audioLists[listindex].songs.length; i++){
      if(id == this.audioLists[listindex].songs[i].id){
        flag = true;
        break;
      }
    }
    if(flag) return i;
    else return -1;
  }

  dropSonglist(id: string){
    let index = this.getSonglistById(id);
    if(index >= 0){
      this.audioLists.splice(index, 1);
    }
  }

  addSong(listid: string, song: any){
    let index = this.getSonglistById(listid);
    if(index >= 0){
      this.audioLists[index].songs.push(song);
    }
  }

  deleteSong(listid: string, songid: number){
    let listIndex = this.getSonglistById(listid);
    if(listIndex < 0) return;
    let songIndex = this.getSongById(listIndex, songid);
    if(songIndex < 0) return;
    this.audioLists[listIndex].songs.splice(songIndex, 1);
  }

  modeToSingle(){
    this.audioListMode = 'single';
  }

  modeToOrder(){
    this.audioListMode = 'order';
  }

  modeToRandom(){
    this.audioListMode = 'random';
  }

  storeSonglistData(name: string, songlists: any){
    let that = this;
    this.userData.songlists = songlists;
    return new Promise(function(resolve, reject){
      that.storage.set(name, that.userData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject();
      });
    });
  }

}