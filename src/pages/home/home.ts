import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { ActionSheetController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';

import { SonglistPage } from '../songlist/songlist';
import { SearchlistPage } from '../searchlist/searchlist';
import { File } from '@ionic-native/file';
import { Events } from 'ionic-angular';
import { AudioService } from '../../services/AudioService';
import { NeteaseAPIService } from '../../services/NeteaseAPIService';
import { MainServerService } from '../../services/MainServerService';
import { MDCDialog, MDCDialogFoundation } from '@material/dialog';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('cvs') _cvs: ElementRef;
  @ViewChild('emotioncvs') _emotioncvs: ElementRef;
  @ViewChild('detailcvs') _detailcvs: ElementRef;
  @ViewChild('piccvs') _piccvs: ElementRef;
  @ViewChild('padcvs') _padcvs: ElementRef;
  @ViewChild('toolbar') _toolbar: ElementRef;
  @ViewChild('audio') _audio: ElementRef;
  @ViewChild('simg') _songImg: ElementRef;

  private cvs: any;
  private ctx: any;
  private emotionCvs: any = null;
  private emotionCtx: any = null;
  private detailCvs: any = null;
  private detailCtx: any = null;
  private picCvs: any = null;
  private picCtx: any = null;
  private padCvs: any = null;
  private padCtx: any = null;
  private audio: any;
  private songImg: any;
  private relMusicPath: string = "../../assets/musics/";
  private ratio: number = 1;
  
  private analyser: any;
  private FFTsz: number = 2048;  // fft process size
  private barNum: number = 20;  // fft bars number
  private barPad: number = 10;  // fft bars padding

  private pageTab: number = 2;
  private isPlatformsLoaded: boolean = false;

  private searchInputVal: string = "";
  private searchTarget: string = "song";
  private searchType: number = 0;

  private emotionDialog: any = null;
  private detailDialog: any = null;
  private thumbImg: any = null; // virtual img tag
  private keyboardRelativeStyle: string = "";

  constructor(private navCtrl: NavController, 
    private plt: Platform, 
    private file: File,
    private events: Events,
    private actionSheetCtrl: ActionSheetController,
    private keyboard: Keyboard,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private audioService: AudioService,
    private neteaseAPIService: NeteaseAPIService,
    private mainServerService: MainServerService,) {

    let that = this;

    // get local music list
    this.audioService.servicePrepare();

    //
    this.events.subscribe('AudioService:MusicStateNull', () => {
      that.audio.pause();
      that.audio.src = null;
      that.audioService.audioState = 'released';
    });
    this.events.subscribe('AudioService:MusicStatePlaying', (src) => {
      console.log("Accept MusicStatePlaying.");
      if(src){
        that.audio.src = src;
        that.songImg.src = that.audioService.audioPlaying.album.picUrl;
      }
      that.audio.play();
      that.audioService.audioState = 'playing';
    });
    this.events.subscribe('AudioService:MusicStatePaused', () => {
      that.audio.pause();
      that.audioService.audioState = 'paused';
    });
    this.events.subscribe('AudioService:MusicStateStoped', () => {
      that.audio.pause();
      that.audioService.audioState = 'stoped';
    });

  }

  ionViewDidLoad(){
    let that = this;
    this.cvs = this._cvs.nativeElement;
    this.ctx = this.cvs.getContext('2d');
    this.audio = this._audio.nativeElement;
    this.songImg = this._songImg.nativeElement;
    this.thumbImg = document.createElement('img');
    this.thumbImg.src = null;

    // set audio event
    this.audio.onended = function(){
      that.audioService.stop();
      console.log("song ended.");
      that.audioService.nextSong();
    };

    this.events.subscribe('AudioService:SongChanged', (src) => {
      that.thumbImg.src = src;
    });

    // adjust canvas ratio
    this.init_canvas(this.cvs, this.ctx, 50, -1, 100, 100);

    this.plt.ready().then(readySource =>{
      that.isPlatformsLoaded = true;
      // hide element when keyborad show
      window.addEventListener('keyboardDidShow', (e) => {
        console.log("keyboardshow");
        that.keyboardRelativeStyle = "my-keyboard-hidden";
      }); 
      window.addEventListener('keyboardDidHide', () => {
        that.keyboardRelativeStyle = "";
      });
      //that.prepareAudioContext();
      //that.drawFFTFrame();
      that.drawFrame();
      // get user information
      that.mainServerService.getUserInfo("Accelerator").then(function(r){
        let info = JSON.parse(r.toString());
        if(info.state == 1){
          that.mainServerService.userName = info.info.name;
          console.log("User name loaded.");
        }
      }).catch(function(err){
        console.log("Load user name failed. " + err);
      });
    });

  }

  init_canvas(canvas: any, context: any, height: number, width: number, styleH: number, styleW: number) {
    if(width != -1) canvas.width = width;
    if(height != -1) canvas.height = height;
    //canvas.style.background = "#000000";

    // finally query the various pixel ratios
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
    this.ratio = devicePixelRatio / backingStoreRatio;

    // upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {

        let oldWidth = canvas.width;
        let oldHeight = canvas.height;

        canvas.width = oldWidth * this.ratio;
        canvas.height = oldHeight * this.ratio;

        // fix bug in android
        canvas.style.width = /*oldWidth + 'px'*/styleW.toString() + '%';
        canvas.style.height = /*oldHeight + 'px'*/styleH.toString() + '%';

        // now scale the context to counter
        // the fact that we've manually scaled
        // our canvas element
        context.scale(this.ratio, this.ratio);
    }
  }

  // cannot use in android :(
  // prepare work for fft
  prepareAudioContext() {
      
      //window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
      //window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
      //window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;

      let myAudioContext = new AudioContext();
      let source = myAudioContext.createMediaElementSource(this.audio);
      console.log("aslkdnlak");
      console.log(source);
      this.analyser = myAudioContext.createAnalyser();
      this.analyser.fftSize = this.FFTsz;
      source.connect(this.analyser);
      this.analyser.connect(myAudioContext.destination);
      let processor = myAudioContext.createScriptProcessor(1024);
      processor.connect(myAudioContext.destination);
      this.analyser.connect(processor);
  }

  // cannot use in android :(
  // draw fft frame
  drawFFTFrame() {
      let drawOne = function(that: any){
          that.ctx.clearRect(0, 0, that.cvs.width, that.cvs.height);
          let array = new Uint8Array(that.analyser.frequencyBinCount);
          that.analyser.getByteFrequencyData(array);
          let spaceSize = Math.round((that.cvs.width/that.ratio-2*that.barPad)/(that.barNum-1));
          for(let i=0; i<that.barNum; i++){
              that.ctx.save();
              that.ctx.beginPath();
              let h = array[Math.round(i*that.FFTsz/(that.barNum*2))]/(512*that.ratio/that.cvs.height);
              that.ctx.lineWidth = 3;
              that.ctx.lineCap = "round";
              that.ctx.moveTo(i * spaceSize + that.barPad, that.cvs.height / (2 * that.ratio) - h);
              that.ctx.lineTo(i * spaceSize + that.barPad, that.cvs.height / (2 * that.ratio) + h);
              that.ctx.strokeStyle = "rgba(0,0,0,0.15)";
              that.ctx.stroke();
              that.ctx.restore();
              if(that.audioService.audioPlaying){
                let tmp = that.audioService.audioPlaying;
                that.ctx.font="18px Microsoft Yahei";
                that.ctx.fillStyle = "black"; 
                that.ctx.fillText(tmp.name, 15, that.cvs.height / (2 * that.ratio));
                that.ctx.font="13px Microsoft Yahei"; 
                that.ctx.fillStyle = "rgb(114, 114, 114)";
                that.ctx.fillText(tmp.artist.name, 15, that.cvs.height / (2 * that.ratio) + 20);
              }
          }
          if(that.detailCvs){
            that.detailCtx.clearRect(0, 0, that.detailCvs.width, that.detailCvs.height);

            // draw progress
            that.detailCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            let xratio = 0;
            if(that.audio && that.audio.src){
              xratio = that.audio.currentTime * 1.0 / that.audio.duration;
            }
            that.detailCtx.fillRect(0, 0, that.detailCvs.width * xratio / that.ratio, that.detailCvs.height / that.ratio);

            for(let i=0; i<that.barNum-2; i=i+2){
              that.detailCtx.save();
              that.detailCtx.beginPath();
              that.detailCtx.lineWidth = 3;
              let h = array[Math.round(i*that.FFTsz/(that.barNum*2))]/(512*that.ratio/that.detailCvs.height);
              let p1 = {
                x: i * spaceSize + that.barPad,
                yp: that.detailCvs.height / (2 * that.ratio) + h,
                yn: that.detailCvs.height / (2 * that.ratio) - h
              }
              h = array[Math.round((i+1)*that.FFTsz/(that.barNum*2))]/(512*that.ratio/that.detailCvs.height);
              let p2 = {
                x: (i + 1) * spaceSize + that.barPad,
                yp: that.detailCvs.height / (2 * that.ratio) + h,
                yn: that.detailCvs.height / (2 * that.ratio) - h
              }
              h = array[Math.round((i+2)*that.FFTsz/(that.barNum*2))]/(512*that.ratio/that.detailCvs.height);
              let p3 = {
                x: (i + 2) * spaceSize + that.barPad,
                yp: that.detailCvs.height / (2 * that.ratio) + h,
                yn: that.detailCvs.height / (2 * that.ratio) - h
              }
              that.detailCtx.moveTo(p1.x, p1.yp);
              that.detailCtx.quadraticCurveTo(p2.x,p2.yp,p3.x,p3.yp);
              that.detailCtx.moveTo(p1.x, p1.yn);
              that.detailCtx.quadraticCurveTo(p2.x,p2.yn,p3.x,p3.yn);
              that.detailCtx.strokeStyle = "rgba(255, 230, 124, 0.7)";
              that.detailCtx.stroke();
              that.detailCtx.restore();
            }
          }
          requestAnimationFrame(function(){
            drawOne(that);
          });
      }
      let that = this;
      requestAnimationFrame(function(){
          drawOne(that);
      });
  }

  // draw progress and music name frame
  drawFrame() {
      this.ctx.scale(1.1, 0.9);
      let drawOne = function(that: any){

          that.ctx.clearRect(0, 0, that.cvs.width, that.cvs.height);
          if(that.audioService.audioPlaying){
            let tmp = that.audioService.audioPlaying;
            that.ctx.font="14px Microsoft Yahei";
            that.ctx.fillStyle = "black"; 
            that.ctx.fillText(tmp.name, 15, that.cvs.height / (2 * that.ratio) - 5);
            that.ctx.font="11px Microsoft Yahei"; 
            that.ctx.fillStyle = "rgb(114, 114, 114)";
            that.ctx.fillText(tmp.artist.name, 15, that.cvs.height / (2 * that.ratio) + 15);
          }
          else{
            that.ctx.font="14px Microsoft Yahei";
            that.ctx.fillStyle = "black";
            that.ctx.fillText("神秘音乐", 15, that.cvs.height / (2 * that.ratio) - 5);
            that.ctx.font="11px Microsoft Yahei";
            that.ctx.fillStyle = "rgb(114, 114, 114)";
            that.ctx.fillText("神秘歌手", 15, that.cvs.height / (2 * that.ratio) + 15);
          }

          if(that.detailCvs){
            that.detailCtx.clearRect(0, 0, that.detailCvs.width, that.detailCvs.height);
            // changable settings
            let CIRCLE_R = that.detailCvs.width / (2 * that.ratio);
            let CIRCLE_COLOR_PASSED = 'rgba(255, 255, 255, 0.3)';
            let CIRCLE_COLOR_AVAILABLE = 'rgba(0, 0, 0, 0.6)';
            let CIRCLE_CENTER = {
              x: that.detailCvs.width / (2 * that.ratio),
              y: that.detailCvs.height / (2 * that.ratio)
            }

            // draw progress
            let xratio = 0;
            if(that.audio && that.audio.src){
              xratio = that.audio.currentTime * 1.0 / that.audio.duration;
              that.detailCtx.fillStyle = CIRCLE_COLOR_PASSED;
              that.detailCtx.beginPath();
              that.detailCtx.moveTo(CIRCLE_CENTER.x, CIRCLE_CENTER.y);
              that.detailCtx.arc(CIRCLE_CENTER.x, CIRCLE_CENTER.y, CIRCLE_R, - Math.PI / 2, - Math.PI / 2 + 2 * Math.PI * xratio);
              that.detailCtx.fill();
              that.detailCtx.fillStyle = CIRCLE_COLOR_AVAILABLE;
              that.detailCtx.beginPath();
              that.detailCtx.moveTo(CIRCLE_CENTER.x, CIRCLE_CENTER.y);
              that.detailCtx.arc(CIRCLE_CENTER.x, CIRCLE_CENTER.y, CIRCLE_R, - Math.PI / 2 + 2 * Math.PI * xratio, Math.PI * 3 / 2);
              that.detailCtx.fill();
            }
          }
          requestAnimationFrame(function(){
            drawOne(that);
          });
      }
      let that = this;
      requestAnimationFrame(function(){
          drawOne(that);
      });
  }

  selectSearchType(type: number){
    this.searchType = type;
  }

  search(){
    let that = this;
    let t = this.presentToastFuction("努力搜索中...");
    this.mainServerService.search(this.searchInputVal, this.searchType).then(function(r){
      t.dismiss();
      that.navCtrl.push(SearchlistPage, {
        result: JSON.parse(r.toString()),
        target: that.searchType
      });
    }).catch(function(err){
      t.dismiss();
      that.presentToastDuration("搜索失败", 1000);
      console.log(err);
    });
  }

  moveSongPos(event){
    let pos = this.findPos(this.detailCvs);
    let _x = event.clientX - pos.left;
    let _y = event.clientY - pos.top;
    let xratio = _x * 1.0 / this.detailCvs.scrollWidth;
    let yratio = _y * 1.0 / this.detailCvs.scrollHeight;
    let x = xratio * this.detailCvs.width / this.ratio;
    let y = yratio * this.detailCvs.height / this.ratio;
    let angle = Math.atan2(y - this.detailCvs.height / (2 * this.ratio), x - this.detailCvs.width / (2 * this.ratio));
    console.log(angle);
    if( angle > - Math.PI / 2) angle = angle + Math.PI / 2;
    else angle = angle + Math.PI * 5 / 2;
    let ratio = angle / (Math.PI * 2);
    if(this.audio && this.audio.src){
      this.audio.currentTime = this.audio.duration * ratio;
    }
  }

  drawEmotionSelector(){
      let height = this.plt.height();
      let width = this.plt.width();
      let edgeLen = Math.min(height, width) - 20;
      this.init_canvas(this.emotionCvs, this.emotionCtx, edgeLen, edgeLen, 100, 100);
      // adjust canvas style
      let circleNum = 5;
      let step = (this.emotionCvs.width / this.ratio - 10) / 10;
      let xcenter = this.emotionCvs.width / (2 * this.ratio);
      let ycenter = this.emotionCvs.height / (2 * this.ratio);
      let colors = ['#BFC932', '#FDD734', '#FFB200', '#FB8C00', '#F24B21'];
      this.emotionCtx.beginPath();
      this.emotionCtx.lineWidth = 3;
      this.emotionCtx.lineCap = 'round';
      this.emotionCtx.moveTo(xcenter, 5);
      this.emotionCtx.lineTo(xcenter, this.emotionCvs.height / this.ratio - 5);
      this.emotionCtx.moveTo(5, ycenter);
      this.emotionCtx.lineTo(this.emotionCvs.width / this.ratio - 5, ycenter);
      this.emotionCtx.stroke();
      for(let i=1; i<=circleNum; i++){
        this.emotionCtx.beginPath();
        this.emotionCtx.lineWidth = 5;
        this.emotionCtx.lineCap = 'round';
        this.emotionCtx.strokeStyle = colors[i-1];
        this.emotionCtx.arc(xcenter, ycenter, i * step, 0, 2 * Math.PI);
        this.emotionCtx.stroke();
      }
  }

  emotionDialogShow(){
    let that = this;
    if(!this.emotionDialog){
      this.emotionDialog = new MDCDialog(document.querySelector('#emotion-dialog'));
      this.emotionCvs = this._emotioncvs.nativeElement;
      this.emotionCtx = this.emotionCvs.getContext('2d');
    }
    this.emotionCtx.clearRect(0, 0, this.emotionCvs.width / this.ratio, this.emotionCvs.height / this.ratio);
    this.drawEmotionSelector();
    this.emotionDialog.show();
    this.keyboardRelativeStyle = 'my-keyboard-hidden';
    this.emotionDialog.listen('MDCDialog:cancel', function() {
      console.log('emotionDialog canceled.');
      that.keyboardRelativeStyle = '';
    })
  }

  findPos(obj: any) {
    let curleft = 0;
    let curtop = 0;
    if (obj.offsetParent){
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
    }
    return {
      left: curleft,
      top: curtop
    };
  }

  paintEnotionPoint(event: any){
    this.emotionCtx.clearRect(0, 0, this.emotionCvs.width / this.ratio, this.emotionCvs.height / this.ratio);
    this.drawEmotionSelector();

    let pos = this.findPos(this.emotionCvs);
    let _x = event.clientX - pos.left;
    let _y = event.clientY - pos.top;
    let x = _x * 2 / (this.emotionCvs.width / this.ratio - 5) - 1;
    let y =  - _y * 2 / (this.emotionCvs.height / this.ratio - 5) + 1;

    this.audioService.valence = x;
    this.audioService.arousal = y;

    let grd = this.emotionCtx.createRadialGradient(_x, _y, 15, _x, _y, 30);
    grd.addColorStop(0 ,"rgba(255, 255, 255, 0.85)");
    grd.addColorStop(1 ,"rgba(255, 255, 255, 0)");
    this.emotionCtx.fillStyle = grd;
    this.emotionCtx.fill();

    this.emotionCtx.font="20px Microsoft Yahei";
    this.emotionCtx.textAlign="center";
    let emotionStr = 'Arousal:' + x.toString().substring(0,4) + ', Valence:' + y.toString().substring(0,4);
    this.emotionCtx.fillStyle = "#ffffff";
    this.emotionCtx.fillText(emotionStr, this.emotionCvs.width / (2 * this.ratio), this.emotionCvs.height / this.ratio - 25);

    console.log("x:" + x + ", y:" + y);
  }

  detailDialogShow(){
    let that = this;
    if(!this.detailDialog){
      this.detailDialog = new MDCDialog(document.querySelector('#detail-dialog'));
      this.detailCvs = this._detailcvs.nativeElement;
      this.detailCtx = this.detailCvs.getContext('2d');
      this.picCvs = this._piccvs.nativeElement;
      this.picCtx = this.picCvs.getContext('2d');
      this.padCvs = this._padcvs.nativeElement;
      this.padCtx = this.padCvs.getContext('2d');
      let height = this.plt.height();
      let width = this.plt.width();
      let edgeLen = Math.min(height, width) - 100;
      this.init_canvas(this.detailCvs, this.detailCtx, edgeLen, edgeLen, 70, 70);
      this.init_canvas(this.picCvs, this.picCtx, edgeLen, edgeLen, 70, 70);
      this.init_canvas(this.padCvs, this.padCtx, edgeLen, edgeLen, 70, 70);

      if(this.audioService.audioPlaying){
        this.thumbImg.src = this.audioService.audioPlaying.album.picUrl;
      }

      this.thumbImg.onload = function(){
        let CIRCLE_R = that.picCvs.width / (2 * that.ratio);
        let CIRCLE_COLOR_PASSED = 'rgba(0, 0, 0, 0.3)';
        let CIRCLE_COLOR_AVAILABLE = 'rgba(0, 0, 0, 0.6)';
        let CIRCLE_CENTER = {
          x: that.picCvs.width / (2 * that.ratio),
          y: that.picCvs.height / (2 * that.ratio)
        }
        if(that.thumbImg.src){
          that.picCtx.beginPath();
          that.picCtx.moveTo(CIRCLE_CENTER.x, CIRCLE_CENTER.y);
          that.picCtx.arc(CIRCLE_CENTER.x, CIRCLE_CENTER.y, CIRCLE_R, 0, 2 * Math.PI, true);
          that.picCtx.clip();
          that.picCtx.drawImage(that.thumbImg, CIRCLE_CENTER.x - CIRCLE_R, CIRCLE_CENTER.y - CIRCLE_R, 2 * CIRCLE_R, 2 * CIRCLE_R);
        }
      };
    }
    this.detailDialog.show();
    this.keyboardRelativeStyle = 'my-keyboard-hidden';
    this.detailDialog.listen('MDCDialog:cancel', function() {
      console.log('detailDialog canceled.');
      that.keyboardRelativeStyle = '';
    })
  }

  presentActionSheet(item: any, event: any) {
    // prevent bubbling up click event
    event.stopPropagation();
    let that = this;
    let actionSheet = this.actionSheetCtrl.create({
      title: item.name,
      buttons: [
        {
          text: "删除歌单",
          icon: 'ios-trash-outline',
          handler: () => {
            that.deleteSonglist(item.id);
          }
        }
      ]
    });
    actionSheet.present();
  }

  presentListNameAlert(){
    let that = this;
    let alert = this.alertCtrl.create({
      title: '歌单名',
      inputs: [
        {
          name: 'songlistName',
          placeholder: '歌单名'
        }
      ],
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: '创建',
          handler: data => {
            if(data.songlistName.length > 0){
              that.addSonglist(data.songlistName);
            }
          }
        }
      ]
    });
    alert.present();
  }

  synchronize(){
    let that = this;
    let t = this.presentToastFuction("同步歌单中...");
    this.mainServerService.getUserSonglist().then(function(r){
      that.audioService.audioLists = r;
      return that.audioService.storeSonglistData(that.mainServerService.userName, r);
    }).then(function(){
      console.log("Synchronize songlist successfully.");
      t.dismiss();
      that.presentToastDuration("同步成功", 1000);
    }).catch(function(){
      console.log("Synchronize songlist unsuccessfully.");
      t.dismiss();
      that.presentToastDuration("同步失败", 1000);
    });
  }

  addSonglist(name: string){
    let that = this;
    if(!this.mainServerService.userName){
      console.log("user information is not prepared.");
      return;
    }
    let t = this.presentToastFuction("创建歌单中...");
    this.audioService.addSonglist(name, this.mainServerService.userName).then(function(){
      console.log("add songlist succeed.");
      t.dismiss();
      that.presentToastDuration("创建成功", 1000);
    }).catch(function(err){
      console.log(err);
      t.dismiss();
      that.presentToastDuration("创建失败", 1000);
    });
  }

  deleteSonglist(id: string){
    let that = this;
    if(!this.mainServerService.userName){
      console.log("user information is not prepared.");
      return;
    }
    let t = this.presentToastFuction("删除歌单中...");
    this.audioService.deleteSonglist(id, this.mainServerService.userName).then(function(){
      console.log("delete songlist succeed.");
      t.dismiss();
      that.presentToastDuration("删除成功", 1000);
    }).catch(function(err){
      console.log(err);t.dismiss();
      that.presentToastDuration("删除失败", 1000);
    });
  }

  buildEmotionSonglist(){
    this.audioService.createEmotionSonglist();
    this.presentToastDuration("创建成功", 1000);
  }

  clickShowSongList(listid: string){
    console.log(this);
  	this.navCtrl.push(SonglistPage, {
      listid: listid
    });
  }

  switchTab(id: string){
    this.pageTab = parseInt(id);
  }

  // init image
  imgError(){
    console.log("trigger image error event");
    if(this.songImg)
      this.songImg.src = "../../assets/imgs/notFound_squre.jpg";
  }

  playOrPauseMusic(){
    if(this.audioService.audioPlaying){
      if(this.audioService.audioState != 'playing'){
        this.audioService.play(this.audioService.audioPlaying.id);
      }
      else{
        this.audioService.pause();
      }
    }
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
