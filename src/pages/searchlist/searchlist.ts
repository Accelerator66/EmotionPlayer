import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NavParams } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { ActionSheetController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';

import { AudioService } from '../../services/AudioService';
import { MainServerService } from '../../services/MainServerService';

@Component({
  selector: 'page-searchlist',
  templateUrl: 'searchlist.html'
})
export class SearchlistPage {

  public searchResult: any = [];
  public searchTarget: string = "song";	// song, album, singer
  public isResultLoaded: boolean = false;

  constructor(
  	public navCtrl: NavController,
  	public navParams: NavParams,
  	public plt: Platform,
    public actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    public audioService: AudioService,
    public mainServerService: MainServerService) {

  	this.searchResult = this.navParams.get('result');
    let t = this.navParams.get('target');
    if(t <= 2) this.searchTarget = 'song';
    else if(t <= 5) this.searchTarget = 'album';
    else if(t <= 8) this.searchTarget = 'singer';

    this.isResultLoaded = true;
    
  }

  addSongToSonglist(listid: string, item: any){
    let that = this;
    let username = this.mainServerService.userName;
    if(!username){
      console.log("user information is not prepared.");
      return;
    }
    let t = this.presentToastFuction("添加歌曲...");
    let songbd = this.audioService.createSong(item, "remote");
    this.audioService.addSongToSonglist(listid, item.id, username, songbd).then(function(){
      console.log("add song to songlist succeed.");
      t.dismiss();
      that.presentToastDuration("添加成功", 1000);
    }).catch(function(err){
      console.log(err);
      t.dismiss();
      that.presentToastDuration("发生了不可描述的问题", 1000);
    });
  }

  presentActionSheet(item: any) {
    let btns = [];
    let that = this;
    for(let i=0; i<that.audioService.audioLists.length; i++){
      let list = that.audioService.audioLists[i];
      btns.push({
        text: list.name,
        handler: () => {
          that.addSongToSonglist(list.id, item);
        }
      });
    }
    btns.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    });
    let actionSheet = that.actionSheetCtrl.create({
      title: item.name,
      buttons: btns
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

  clickReturn(){
  	this.navCtrl.pop();
  }

}