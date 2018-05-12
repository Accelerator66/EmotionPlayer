import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';

@Injectable()
export class NeteaseAPIService {
  private serverBaseUrl: string = "http://115.159.210.157:3000";
  private recSonglist: any = null;
  private hotSonglist: any = null;
  constructor(private plt: Platform, public events: Events, private http: HTTP){
    this.plt.ready().then(readySource => {
      // try to read song list
      this.getRecSonglist();
      this.getHotSonglist();
    });
  }

  // call song list recommendation API
  // API address "/personalized"
  getRecSonglist(){
  	this.http.get(this.serverBaseUrl + '/personalized', {}, {})
	  .then(data => {
	    console.log(data.status);
	    //console.log(data.data); // data received by server
	    console.log(data.headers);
	    let resultParser = JSON.parse(data.data).result;
	    this.recSonglist = [];
	    this.recSonglist.push(resultParser.slice(0, 3));
	    this.recSonglist.push(resultParser.slice(3, 6));
    	this.events.publish('NeteaseAPIService:getRecSonglist', 1);	// success event
	  })
	  .catch(error => {
	    console.log(error.status);
	    console.log(error.error); // error message as string
	    console.log(error.headers);
	    this.events.publish('NeteaseAPIService:getRecSonglist', 0);	// unsuccess event
	  });
  }

  getHotSonglist(){
  	this.http.get(this.serverBaseUrl + '/top/playlist/highquality?limit=10', {}, {})
	  .then(data => {
	    console.log(data.status);
	    //console.log(data.data); // data received by server
	    console.log(data.headers);
	    let resultParser = JSON.parse(data.data).playlists;
	    this.hotSonglist = resultParser;
    	this.events.publish('NeteaseAPIService:getHotSonglist', 1);	// success event
	  })
	  .catch(error => {
	    console.log(error.status);
	    console.log(error.error); // error message as string
	    console.log(error.headers);
	    this.events.publish('NeteaseAPIService:getHotSonglist', 0);	// unsuccess event
	  });
  }
}