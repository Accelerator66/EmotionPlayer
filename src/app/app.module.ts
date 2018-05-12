import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import {
  MdcFabModule,
  MdcMenuModule
} from '@angular-mdc/web';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SonglistPage } from '../pages/songlist/songlist';

import { File } from '@ionic-native/file';
import { Media } from '@ionic-native/media';
import { HTTP } from '@ionic-native/http';
import { AudioService } from '../services/AudioService';
import { NeteaseAPIService } from '../services/NeteaseAPIService';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    SonglistPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    MdcFabModule,
    MdcMenuModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    SonglistPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    File,
    Media,
    HTTP,
    AudioService,
    NeteaseAPIService
  ]
})
export class AppModule {}
