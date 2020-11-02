'use strict';

const Homey = require('homey');

const fetch = require('node-fetch')

class MertikWifiApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MertikWifiApp has been initialized');
  }
}

module.exports = MertikWifiApp;