'use strict';

const Homey = require('homey');

const fetch = require('node-fetch')

class MertikWifiApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    /*if (process.env.DEBUG === '1'){
      try{ 
        require('inspector').waitForDebugger();
      }
      catch(error){
        require('inspector').open(9225, '0.0.0.0', true);
      }
  }*/
  
    this.log('MertikWifiApp has been initialized');
  }
}

module.exports = MertikWifiApp;