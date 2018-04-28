import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { ActionSheetController } from 'ionic-angular';

import { File } from '@ionic-native/file';
import { AudioService } from '../../services/AudioService';

@Component({
  selector: 'page-songlist',
  templateUrl: 'songlist.html'
})
export class SonglistPage {

  public musicItemsIsLoad: boolean = false;

  constructor(
  	public navCtrl: NavController, 
  	public file: File, 
  	public plt: Platform, 
  	public audioService: AudioService, 
  	public events: Events, 
  	public actionSheetCtrl: ActionSheetController) {

    if(this.audioService.audioList != null){
      this.musicItemsIsLoad = true;
    }
    // use native api need platform to be ready
    this.plt.ready().then(readySource =>{
      console.log('Platform ready from', readySource);
      events.subscribe('AudioService:songlistReady', () => {
	    // songlist is loaded
	    console.log("Get AudioService:songlistReady.");
	    this.musicItemsIsLoad = true;
	  });
    });
  }

  clickReturn(){
  	this.navCtrl.pop();
  }

  clickChangeState(name: string, type: string){
    if(!this.audioService.isCurrent(name)){
    	this.audioService.loadSong(name, type);
    }
    if(this.audioService.audioState === 'playing'){
    	this.audioService.pause();
    }
    else{
    	this.audioService.play();
    }
  }

  presentActionSheet(item: any) {
    let actionSheet = this.actionSheetCtrl.create({
	    title: item.music_name,
	    buttons: [
	      {
	        text: item.singer,
	        icon: 'ios-person-outline',
	        handler: () => {
	          console.log('Singer clicked');
	        }
	      },{
	        text: item.album,
	        icon: 'ios-disc-outline',
	        handler: () => {
	          console.log('Album clicked');
	        }
	      },{
	        text: 'Cancel',
	        role: 'cancel',
	        handler: () => {
	          console.log('Cancel clicked');
	        }
	      }
	    ]
	});
	actionSheet.present();
  }

}