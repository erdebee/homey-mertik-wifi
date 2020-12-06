'use strict';

const Homey = require('homey');
const net = require('net');

const prefix = '02333033303330333038303'

function hex2bin(hex){
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function fromBitStatus(hex,index) {
  return hex2bin(hex).substr(index, 1) === "1";
}

class MertikWifi extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Mertik Wifi device has been initialized');
    this.refreshStatus();
    
    setInterval((e) => e.refreshStatus(), 15000, this);
    this.registerCapabilityListener('operation_mode', this.onCapabilityOperationMode.bind(this));
    this.registerCapabilityListener('dual_flame', this.onCapabilityDualFlame.bind(this));
    this.registerCapabilityListener('flame_height', this.onCapabilityFlameHeight.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
  }

  async onCapabilityOperationMode( value, opts ) {
    await this.setOperationMode(value);
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
  
  refreshStatus() {
  	var msg = "03303";
  	
  	return this.sendCommand(msg);
  }
  
  setOperationMode(value) {
    let curState = this.getCapabilityValue('operation_mode');    
   
   //  this.getDriver()
// 		.triggerOperationModeChanged
// 		.trigger(this, {}, {
// 			"operation_mode": operation_mode, 
// 			"uid": device.getData().uid
// 		})
// 		.catch( this.error )
// 		.then( this.log );
   
    if (value == "on" && curState == "stand_by") {
      console.log("standby to on");
      return this.setFlameHeight(11);
    }else if (value == "on" && curState == "off") {
      console.log("off to on");
      return this.igniteFireplace();
    }else if (value == "on") {
      console.log("?? to on - doing nothing");    
      return;        
    }else if (value == "stand_by"){
      console.log("to standby");        
      return this.standBy();    
    }else{
      console.log("to off");            
      return this.guardFlameOff();
    }
    
  }

  standBy() {
    var msg = "136303003"
    
    return this.sendCommand(msg);
  }
  
  auxOn() {    
    this.getDriver().triggerDualFlameToggle.trigger(this, {}, {});
	this.getDriver().triggerDualFlameOn.trigger(this, {}, {});
    var msg = "2303031030a";
	return this.sendCommand(msg);
  }

  auxOff() {
    this.getDriver().triggerDualFlameToggle.trigger(this, {}, {});
	this.getDriver().triggerDualFlameOff.trigger(this, {}, {});
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
    
	this.getDriver().triggerFlameHeightChanged
		.trigger(this, {}, {
			"flame_height": flame_height, 
			"uid": this.getData().uid
		})
		.catch( this.error )
		.then( this.log );
	
    return this.sendCommand(msg);
  }
  
  processStatus(statusStr) {
	var on = true;
  	var flameHeight = (parseInt("0x" + statusStr.substr(14,2)));
  	
  	if (flameHeight < 128) {
  		flameHeight = 0;
  		on = false;
  	}else{
	  	flameHeight = Math.round(((flameHeight - 128) / 128) * 11)
  	}
  	
  	let statusBits = statusStr.substr(16,4);
  	let shuttingDown = fromBitStatus(statusBits, 7);
  	let guardFlameOn = fromBitStatus(statusBits, 8);
  	let igniting = fromBitStatus(statusBits, 11);
  	let auxOn = fromBitStatus(statusBits, 12);
  	let lightOn = fromBitStatus(statusBits, 13);  	  	
  	
  	var dimLevel = statusStr.substr(20,2);
  	dimLevel = ((parseInt("0x" + dimLevel) - 100) / 151);
  	if (dimLevel < 0 || !lightOn) dimLevel = 0;
  	
  	let ambientTemp = parseInt("0x" + statusStr.substr(30,2)) / 10;

  	console.log("Status update!!");   	
  	console.log("Fireplace on: " + on);  	
  	console.log("Flame height: " + flameHeight);  	
	console.log("Guard flame on: " + guardFlameOn);
	console.log("Igniting: " + igniting);
	console.log("Shutting down: " + shuttingDown);	
	console.log("Aux on: " + auxOn);
	console.log("Light on: " + lightOn);    
	console.log("Dim level: " + dimLevel);    
	console.log("Ambient temp: " + ambientTemp);    
	
	
	var opMode = "on";
	
	if (!on && !igniting) {
	  if (guardFlameOn && !shuttingDown) {
	    opMode = "stand_by";
	  }else{
	  	opMode = "off";
	  }
	}
	console.log("Operation mode: " + opMode)
	this.setCapabilityValue("operation_mode", opMode);
	this.setCapabilityValue("flame_height", flameHeight);
	this.setCapabilityValue("dual_flame", auxOn);
	this.setCapabilityValue("dim", dimLevel);
	this.setCapabilityValue("measure_temperature", ambientTemp);
  }

  sendCommand(msg) {
    let thiz = this;
    var packet = Buffer.from(prefix + msg, 'hex');
    console.log("Sending data: " + prefix + msg);
    var ip = this.getData().id;

    if ((typeof(this.client) === 'undefined') || (typeof(this.client.destroyed) != 'boolean') || (this.client.destroyed == true)) {    
		console.log("new socket");
		this.client = new net.Socket();
		this.client.connect(2000, ip);
		 // add handler for any response or other data coming from the device
		this.client.on('data', function(data) {
			let tempData = data.toString().substr(1).replace(/\r/g, ";");

			console.log("Got data: " + tempData);
			if (tempData.startsWith("03030000000346")) {
				thiz.processStatus(tempData);
			}
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
