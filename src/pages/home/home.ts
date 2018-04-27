import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Platform } from 'ionic-angular';

import { SonglistPage } from '../songlist/songlist';
import { File } from '@ionic-native/file';
import { AudioService } from '../../services/AudioService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('cvs') _cvs: ElementRef;
  @ViewChild('toolbar') _toolbar: ElementRef;
  @ViewChild('HTMLaudio') _HTMLaudio: ElementRef;
  private cvs: any;
  private ctx: any;
  public audio: any;
  private ratio: number = 1;

  constructor(public navCtrl: NavController, public plt: Platform, public file: File, public audioService: AudioService) {

  }

  ionViewDidLoad(){
    this.cvs = this._cvs.nativeElement;
    this.ctx = this.cvs.getContext('2d');
    // adjust canvas ratio
    this.init_canvas(this.cvs, this.ctx, 100, -1);

    this.plt.ready().then(readySource =>{
      this.audio = this._HTMLaudio.nativeElement;
      this.audio.volume = 0;  // set volume to 0, we only use this to FFT
      //this.audio.src = this.audioService.audioRootPath + this.audioService.audioPlayingName;
    });

    // test canvas
    this.ctx.beginPath();
            this.ctx.lineWidth = 10;
            this.ctx.lineCap = "round";
            this.ctx.moveTo(20, this.cvs.height / (2 * this.ratio));
            this.ctx.lineTo(100, this.cvs.height / (2 * this.ratio));
            this.ctx.strokeStyle = "rgba(255,255,255,0.7)";
            this.ctx.stroke();

  }

  init_canvas(canvas: any, context: any, height: number, width: number) {
    if(width != -1) canvas.width = width;
    if(height != -1) canvas.height = height;
    canvas.style.background = "#000000";

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
        canvas.style.width = /*oldWidth + 'px'*/'100%';
        canvas.style.height = /*oldHeight + 'px'*/'100%';

        // now scale the context to counter
        // the fact that we've manually scaled
        // our canvas element
        context.scale(this.ratio, this.ratio);
    }
  }

  clickShowSongList(){
  	this.navCtrl.push(SonglistPage);
  }

}
