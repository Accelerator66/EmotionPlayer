import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';
import { Events } from 'ionic-angular';
import { Md5 } from 'ts-md5/dist/md5';


/** Class that connects and gets information from database in main server */
@Injectable()
export class MainServerService {

  public serverAddress: string = "http://192.168.0.42:3000/";
  public userName: string = null;
  private isPltReady: boolean = false;
  public emotionRecList: any = [];
  public randomRecList: any = [];

  constructor(private plt: Platform,
              private events: Events,
              private http: HTTP,
              private file: File){
    let that = this;
    this.plt.ready().then(readySource => {
      that.isPltReady = true;
      that.getRandomRec();
      that.getEmotionRec(0, 0, 10);
    });
  }


  /**
   * Search songs, albums, singers by keyword.
   *
   * @param      {string}  keyword  The searching keyword
   * @param      {number}  type     The type of seraching
   * @return     {Promise}  Promise object contains searching results
   */
  search(keyword: string, type: number){
  	let url = this.serverAddress + "search?type=" + type.toString() + "&keyword=" + keyword;
  	let that = this;
  	return new Promise(function(resolve, reject){
  		that.http.get(url, {}, {}).then(data => {
		    console.log(data.status);
		    resolve(data.data);
  		}).catch(error => {
  		    console.log(error.status);
  		    console.log(error.error);
  		    console.log(error.headers);
  		    var result = [];
  		    reject(error.error);
  		});
  	});
  }


  /**
   * Users register.
   *
   * @param      {string}  name      The user name
   * @param      {string}  password  The user password
   * @return     {Promise}  Promise object contains register result
   */
  register(name: string, password: string){
  	let that = this;
  	return new Promise(function(resolve, reject){
	  	let md5Code = Md5.hashStr(name + password);
	  	let url = that.serverAddress + "register?username=" + name + "&password=" + md5Code;
	  	that.http.get(url, {}, {}).then(data => {
  			console.log(data.status);
  			resolve(data.data);
  		}).catch(error => {
  			console.log(error.status);
  		    console.log(error.error);
  		    console.log(error.headers);
  		    reject(error.error);
  		});
  	});
  }

  login(name: string, password: string){
    let that = this;
    return new Promise(function(resolve, reject){
      let md5Code = Md5.hashStr(name + password);
      let url = that.serverAddress + "checkLogin?username=" + name + "&password=" + md5Code;
      that.http.get(url, {}, {}).then(data => {
        console.log(data.status);
        resolve(data.data);
      }).catch(error => {
        console.log(error.status);
          console.log(error.error);
          console.log(error.headers);
          reject();
      });
    });
  }


  /**
   * Gets the user information.
   *
   * @param      {string}  name     The user name
   * @return     {Promise}  Promise object contains user information.
   */
  getUserInfo(name: string){
  	let that = this;
  	return new Promise(function(resolve, reject){
  		let url = that.serverAddress + "getUserInfo?username=" + name;
  		that.http.get(url, {}, {}).then(data => {
  			console.log(data.status);
  			resolve(data.data);
  		}).catch(error => {
  			console.log(error.status);
  		    console.log(error.error);
  		    console.log(error.headers);
  		    reject(error.error);
  		});
  	});
  }


  getEmotionRec(valence: number, arousal: number, num: number){
    let that = this;
    if(!that.isPltReady) return;
    let url = that.serverAddress + "dealEmotion/emotionRec?valence=" + valence.toString()
        + "&arousal=" + arousal.toString() + "&number=" + num;
    that.http.get(url, {}, {}).then(data => {
      console.log(data.status);
      let body = JSON.parse(data.data.toString());
      if(body.state == 0) return;
      else{
        that.emotionRecList = body.data;
      }
    }).catch(error => {
      console.log(error.status);
      console.log(error.error);
      console.log(error.headers);
    });
  }

  getRandomRec(){
    let num = 6;
    let that = this;
    if(!that.isPltReady) return;
    let url = that.serverAddress + "dealEmotion/randomRec?number=" + num;
    that.http.get(url, {}, {}).then(data => {
      console.log(data.status);
      let body = JSON.parse(data.data.toString());
      if(body.state == 0) return;
      else{
        that.randomRecList = body.data;
      }
    }).catch(error => {
      console.log(error.status);
      console.log(error.error);
      console.log(error.headers);
    });
  }

  getUserSonglist(){
    if(!this.userName) return;
    let that = this;
    return new Promise(function(resolve, reject){
      let url = that.serverAddress + "getUserInfo/songlist?username=" + that.userName;
      that.http.get(url, {}, {}).then(data => {
        console.log(data.status);
        let body = JSON.parse(data.data.toString());
        console.log(body.state);
        if(body.state == 1) reject();
        else{
          resolve(body.songlists);
        }
      }).catch(error => {
        console.log(error.status);
        console.log(error.error);
        console.log(error.headers);
        reject();
      });
    });
  }
 }