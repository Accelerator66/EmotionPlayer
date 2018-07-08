import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ToastController } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { MDCTextField } from '@material/textfield';
import { Storage } from '@ionic/storage';
import { MainServerService } from '../../services/MainServerService';
import { AudioService } from '../../services/AudioService';
import { HomePage } from '../home/home';

@Component({
  	selector: 'page-login',
  	templateUrl: 'login.html'
})
export class LoginPage {

	private isPltLoaded: boolean = false;
	private textField: any = null;
	private name: string = "";
	private password: string = "";

	constructor(private navCtrl: NavController,
				private toastCtrl: ToastController,
    			private plt: Platform,
    			private storage: Storage,
    			private mainServerService: MainServerService,
    			private audioService: AudioService) {

		let that = this;
		this.plt.ready().then(readySource => {
			that.isPltLoaded = true;
		});

	}

	ionViewDidLoad(){

	}

	login(){
		if(!this.name || !this.password || !this.isPltLoaded) return;
		let that = this;
		let t = this.presentToastFuction("登陆中");
		this.mainServerService.login(this.name, this.password).then(function(r){
			let result = JSON.parse(r.toString());
			if(result.state == 0){
				that.mainServerService.userName = result.info.name;
				that.checkUserData(that.mainServerService.userName).then(function(){
					t.dismiss();
					console.log("Login successfully.");
					that.navCtrl.push(HomePage);
				});
			}
			else if(result.state == 1){
				console.log("Login failed.");
				t.dismiss();
				that.presentToastDuration("用户名不存在或密码错误", 2000);
				return;
			}
		}).catch(function(){
			t.dismiss();
			that.presentToastDuration("登录发生错误，请重试", 2000);
			console.log("Login error.");
		});
	}

	checkUserData(name: string){
		let that = this;
		return new Promise(function(resolve, reject){
			that.storage.get(name)
		   	.then((val) => {
		       	if(val == null){
		      		console.log("userdata is null: " + name);
		      		let init = {
		         		localsonglists: []
		          	};
		          	that.storage.set(name, init).then(function(){
		          		that.audioService.userData = init;
		          		resolve();
		       		});
		       	}
		        else{
		          	console.log("userdata is available: " + name);
		          	that.storage.get(name).then(function(val){
		          		that.audioService.userData = val;
		          		resolve();
		       		});
		        }
		    })
		    .catch((err) => {
		    	reject(err);
		    });
		});
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