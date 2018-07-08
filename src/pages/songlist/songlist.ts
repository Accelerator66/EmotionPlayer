import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { ActionSheetController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';

import { AudioService } from '../../services/AudioService';
import { MainServerService } from '../../services/MainServerService';

@Component({
  selector: 'page-songlist',
  templateUrl: 'songlist.html'
})
export class SonglistPage {

  public musicItemsIsLoad: boolean = false;
  public currentList: any = null;
  public songlistIdIsReady: boolean = false;

  constructor(
  	public navCtrl: NavController,
    public navParams: NavParams,
  	public plt: Platform,
  	public audioService: AudioService,
    public mainServerService: MainServerService,
  	public events: Events,
    private toastCtrl: ToastController,
  	public actionSheetCtrl: ActionSheetController) {

    let that = this;

    if(this.audioService.isAusioListsLoaded == true){
      let listid = this.navParams.get('listid');
      console.log(listid);
      this.audioService.loadSongList(listid);
      this.songlistIdIsReady = true;
    }

    if(this.audioService.audioListPlaying != null){
      this.musicItemsIsLoad = true;
    }
    // use native api need platform to be ready
    this.plt.ready().then(readySource =>{
      that.events.subscribe('AudioService:songlistReady', () => {
  	    // songlist has been loaded
  	    console.log("Get AudioService:songlistReady.");
  	    that.musicItemsIsLoad = true;
        let listid = navParams.get('listid');
        that.audioService.loadSongList(listid);
        that.songlistIdIsReady = true;
	    });
    });
  }

  clickReturn(){
  	this.navCtrl.pop();
  }

  deleteSongFromSonglist(listid: string, songid: number){
    let that = this;
    let username = this.mainServerService.userName;
    if(!username){
      console.log("user information is not prepared.");
      return;
    }
    let t = this.presentToastFuction("删除歌曲中...");
    this.audioService.deleteSongFromSonglist(listid, songid, username).then(function(){
      console.log("delete song from songlist succeed.");
      if(that.audioService.isCurrent(listid, songid)){
        that.audioService.release();
      }
      t.dismiss();
      that.presentToastDuration("删除成功", 1000);
    }).catch(function(err){
      console.log(err);
      t.dismiss();
      that.presentToastDuration("发生了不可描述的问题", 1000);
    });
  }

  presentActionSheet(item: any, event: any) {
    // prevent bubbling up click event
    event.stopPropagation();
    let that = this;
    let actionSheet = this.actionSheetCtrl.create({
	    title: item.name,
	    buttons: [
	      {
	        text: item.artist.name,
	        icon: 'ios-person-outline',
	        handler: () => {
	          console.log('Singer clicked');
	        }
	      },{
	        text: item.album.name,
	        icon: 'ios-disc-outline',
	        handler: () => {
	          console.log('Album clicked');
	        }
	      },{
          text: '删除歌曲',
          icon: 'ios-trash-outline',
          handler: () => {
            let listid = that.audioService.audioListPlaying.id;
            that.deleteSongFromSonglist(listid, item.id);
          }
        },{
          text: '下载歌曲',
          icon: 'ios-code-download-outline',
          handler: () => {
            console.log("Download function not available.");
          }
        },
        {
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

  presentToastDuration(msg: string, duration: number) {
      let toast = this.toastCtrl.create({
        message: msg,
        duration: duration,
        position: 'middle',
        cssClass: 'my-toast'
      });

      toast.onDidDismiss(() => {
        console.log('Toast ' + msg + ' dismissed toast.');
      });

      toast.present();
  }

  presentToastFuction(msg: string) {
      let toast = this.toastCtrl.create({
        message: msg,
        position: 'middle',
        cssClass: 'my-toast'
      });

      toast.onDidDismiss(() => {
        console.log('Toast ' + msg + ' dismissed toast.');
      });

      toast.present();
      return toast;
  }

}