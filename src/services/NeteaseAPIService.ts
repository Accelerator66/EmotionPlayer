import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';

@Injectable()
export class NeteaseAPIService {
  private serverBaseUrl: string = "http://115.159.210.157:3000";
  private recSonglist: any = null;
  private hotSonglist: any = null;
  public isRecSonglistLoaded: boolean = false;
  public isHotSonglistLoaded: boolean = false;
  constructor(private plt: Platform, public events: Events, private http: HTTP){
  	let that = this;
    this.plt.ready().then((readySource) => {
      // try to read song list
      that.getRecSonglist();
      that.getHotSonglist();
    });
  }

  // call song list recommendation API
  // API address "/personalized"
  getRecSonglist(){
  	let that = this;
  	this.http.get(this.serverBaseUrl + '/personalized', {}, {})
	  .then(data => {
	    console.log(data.status);
	    //console.log(data.data); // data received by server
	    console.log(data.headers);
	    let resultParser = JSON.parse(data.data).result;
	    that.recSonglist = [];
	    that.recSonglist.push(resultParser.slice(0, 3));
	    that.recSonglist.push(resultParser.slice(3, 6));
	    that.isRecSonglistLoaded = true;
    	that.events.publish('NeteaseAPIService:getRecSonglist', 1);	// success event
	  })
	  .catch(error => {
	    console.log(error.status);
	    console.log(error.error); // error message as string
	    console.log(error.headers);
	    that.events.publish('NeteaseAPIService:getRecSonglist', 0);	// unsuccess event
	  });
  }

  getHotSonglist(){
  	let that = this;
  	this.http.get(this.serverBaseUrl + '/top/playlist/highquality?limit=10', {}, {})
	  .then(data => {
	    console.log(data.status);
	    //console.log(data.data); // data received by server
	    console.log(data.headers);
	    let resultParser = JSON.parse(data.data).playlists;
	    that.hotSonglist = resultParser;
	    that.isHotSonglistLoaded = true;
    	that.events.publish('NeteaseAPIService:getHotSonglist', 1);	// success event
	  })
	  .catch(error => {
	    console.log(error.status);
	    console.log(error.error); // error message as string
	    console.log(error.headers);
	    that.events.publish('NeteaseAPIService:getHotSonglist', 0);	// unsuccess event
	  });
  }
}