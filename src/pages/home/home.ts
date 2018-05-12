import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Platform } from 'ionic-angular';

import { SonglistPage } from '../songlist/songlist';
import { File } from '@ionic-native/file';
import { Events } from 'ionic-angular';
import { AudioService } from '../../services/AudioService';
import { NeteaseAPIService } from '../../services/NeteaseAPIService';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('cvs') _cvs: ElementRef;
  @ViewChild('toolbar') _toolbar: ElementRef;

  private cvs: any;
  private ctx: any;
  private ratio: number = 1;
  
  //private analyser: any;
  //private FFTsz: number = 16384;  // fft process size
  //private barNum: number = 40;  // fft bars number
  //private barPad: number = 10;  // fft bars padding

  private pageTab: number = 2;
  private isRecSonglistLoaded: boolean = false;
  private isHotSonglistLoaded: boolean = false;

  constructor(public navCtrl: NavController, 
    public plt: Platform, 
    public file: File,
    public events: Events,
    public audioService: AudioService,
    public neteaseAPIService: NeteaseAPIService) {

    // if songlist is loaded, then show the topic
    // otherwise the topic will be hidden
    this.events.subscribe('NeteaseAPIService:getRecSonglist', (state) => {
      if(parseInt(state) == 1){
        this.isRecSonglistLoaded = true;
      }
      else if(parseInt(state) == 0){
        // todo (load local cache)
      }
      else{
        // todo
      }
    });

    this.events.subscribe('NeteaseAPIService:getHotSonglist', (state) => {
      if(parseInt(state) == 1){
        this.isHotSonglistLoaded = true;
      }
      else if(parseInt(state) == 0){
        // todo (load local cache)
      }
      else{
        // todo
      }
    });

  }

  ionViewDidLoad(){
    this.cvs = this._cvs.nativeElement;
    this.ctx = this.cvs.getContext('2d');
    // adjust canvas ratio
    this.init_canvas(this.cvs, this.ctx, 50, -1);

    this.plt.ready().then(readySource =>{
      //this.prepareAudioContext();
      //this.drawFrame();
    });

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

  // prepare work for fft
  /*
  prepareAudioContext() {
      
      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
      window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
      window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
      
      let myAudioContext = new AudioContext();
      let source = myAudioContext.createMediaElementSource(this.audio);
      this.analyser = myAudioContext.createAnalyser();
      this.analyser.fftSize = this.FFTsz;
      source.connect(this.analyser);
      this.analyser.connect(myAudioContext.destination);
      let processor = myAudioContext.createScriptProcessor(1024);
      processor.connect(myAudioContext.destination);
      this.analyser.connect(processor);
  }*/

  // draw fft frame
  /*
  drawFrame() {
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
              that.ctx.strokeStyle = "rgba(255,255,255,0.7)";
              that.ctx.stroke();
              that.ctx.restore();
          }
          requestAnimationFrame(function(){
            drawOne(that);
          });
      }
      let that = this;
      requestAnimationFrame(function(){
          drawOne(that);
      });
  }*/

  clickShowSongList(){
    console.log(this);
  	this.navCtrl.push(SonglistPage);
  }

  switchTab(id: string){
    this.pageTab = parseInt(id);
  }

}
