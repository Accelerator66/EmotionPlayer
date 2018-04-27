import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Platform } from 'ionic-angular';

import { File } from '@ionic-native/file';
import { AudioService } from '../../services/AudioService';

@Component({
  selector: 'page-songlist',
  templateUrl: 'songlist.html'
})
export class SonglistPage {

  public musicItems: any;
  public musicItemsIsLoad: boolean = false;
  public musicCurrentIndex: number = null;

  constructor(public navCtrl: NavController, public file: File, public plt: Platform, public audioService: AudioService) {
    // use native api need platform to be ready
    this.plt.ready().then(readySource =>{
      console.log('Platform ready from', readySource);
      this.file.listDir(this.file.applicationDirectory, 'www/assets/musics').then(files => {
        this.musicItems = [];
        let count = 0;
        for(let file of files){
          if(file.isDirectory == true){
            console.log("Folder name:" + file.name);
          }
          else if(file.isFile == true){
            console.log("File name:" + file.name);
            this.musicItems.push({
              index : count,
              name: file.name,
              buttonIcon: this.audioService.isCurrent(file.name)?'ios-pause-outline':'ios-play-outline'
            });
            count ++;
          }
        }
        console.log(this.musicItems.length);
        this.musicItemsIsLoad = true; 
      });
    });
  }

  clickReturn(){
  	this.navCtrl.pop();
  }

  clickChangeState(index: number){
  	let name = this.musicItems[index].name;
    if(!this.audioService.isCurrent(name)){
    	if(this.musicCurrentIndex != null){
    		this.musicItems[this.musicCurrentIndex].buttonIcon = 'ios-play-outline';
    	}
    	this.audioService.loadSong(name);
    	this.musicCurrentIndex = index;
    }
    if(this.audioService.audioState === 'playing'){
    	this.audioService.pause();
    	this.audioService.audioState = 'paused';
    	this.musicItems[index].buttonIcon = 'ios-play-outline';
    }
    else{
    	this.audioService.play();
    	this.audioService.audioState = 'playing';
    	this.musicItems[index].buttonIcon = 'ios-pause-outline';
    }
  }

}