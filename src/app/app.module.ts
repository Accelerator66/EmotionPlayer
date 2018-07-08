import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Keyboard } from '@ionic-native/keyboard';

import { MyApp } from './app.component';
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { SonglistPage } from '../pages/songlist/songlist';
import { SearchlistPage } from '../pages/searchlist/searchlist';

import { File } from '@ionic-native/file';
import { HTTP } from '@ionic-native/http';
import { IonicStorageModule } from '@ionic/storage';
import { AudioService } from '../services/AudioService';
import { NeteaseAPIService } from '../services/NeteaseAPIService';
import { MainServerService } from '../services/MainServerService';

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    HomePage,
    SonglistPage,
    SearchlistPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    HomePage,
    SonglistPage,
    SearchlistPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Keyboard,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    File,
    HTTP,
    AudioService,
    NeteaseAPIService,
    MainServerService
  ]
})
export class AppModule {}
