'use strict';

const Homey = require('homey');

const fetch = require('node-fetch');

const net = require('net');

const prefix = '02333033303330333038303'

class MertikWifi extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Mertik Wifi device has been initialized');
    this.refreshStatus();
    
    setInterval((e) => e.refreshStatus(), 15000, this)
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dual_flame', this.onCapabilityDualFlame.bind(this));
    this.registerCapabilityListener('flame_height', this.onCapabilityFlameHeight.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
  }

  async onCapabilityOnoff( value, opts ) {
    if (value) {
      await this.powerOn();
    }else{
      await this.powerOff();    
    }
  }
  
  async onCapabilityDualFlame( value, opts ) {
    if (value) {
      await this.auxOn();
    }else{
      await this.auxOff();    
    }
  }

  async onCapabilityFlameHeight( value, opts ) {
    await this.setFlameHeight(value);
  }  

  async onCapabilityDim( value, opts ) {
    await this.setLightDim(value);
  }  

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Mertik Wifi has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Mertik Wifi settings where changed');
    
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('Mertik Wifi was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Mertik Wifi has been deleted');
  }
  
  refreshStatus() {}
  
  powerOn() {
    return this.setFlameHeight(1.0);
  }

  powerOff() {
    var msg = "136303003"
    
    return this.sendCommand(msg);
  }
  
  auxOn() {    
    var msg = "2303031030a";
    
    return this.sendCommand(msg);
  }

  auxOff() {
    var msg = "2303030030a";
    
    return this.sendCommand(msg);
  }
  
  igniteFireplace() {    
    var msg = "14103";
    
    return this.sendCommand(msg);
  }
  
  guardFlameOff() {    
    var msg = "13003";
    
    return this.sendCommand(msg);
  }
  
  setLightDim(dim_level) {
    var l = 36 + Math.round(9 * dim_level);
    if (l >= 40) l++; // For some reason 40 should be skipped?...
    
    var msg = "3304645" + l + l + "030a"
    
    return this.sendCommand(msg);
  }

  setFlameHeight(flame_height) {
    
    var steps = [
      "3830",
      "3842",
      "3937",
      "4132",
      "4145",
      "4239",
      "4335",
      "4430",
      "4443",
      "4537",
      "4633",
      "4646"
    ];
    var l = steps[flame_height];
    
    var msg = "136" + l + "03";
    
	this.setCapabilityValue("onoff", true);
    
    return this.sendCommand(msg);
  }
  

  sendCommand(msg) {
    var packet = Buffer.from(prefix + msg, 'hex');
    console.log("Sending data: " + prefix + msg);
    var ip = this.getData().id;

    if ((typeof(this.client) === 'undefined') || (typeof(this.client.destroyed) != 'boolean') || (this.client.destroyed == true)) {    
		console.log("new socket");
		this.client = new net.Socket();
		this.client.connect(2000, ip);
		 // add handler for any response or other data coming from the device
		this.client.on('data', function(data) {
			let tempData = data.toString().replace(/\r/g, ";");

			console.log("Got data: " + tempData);
		
		});
		this.client.on('error', function(err) {
			console.log("IP socket error: " + err.message);
			if (typeof(client.destroy) == 'function') {
				client.destroy();
			}
		});
	}
    return this.client.write(packet);
  }
  
 
}

module.exports = MertikWifi;
