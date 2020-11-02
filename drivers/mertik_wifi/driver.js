'use strict';

const net = require('net');

const dgram = require('dgram');

const Homey = require('homey');

const fetch = require('node-fetch');

const reqSync = Buffer.from('000100f6','hex');


class MertikWifiDriver extends Homey.Driver {
  devices = [];
  udpSock = dgram.createSocket('udp4');
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    var self = this;
    
    this.log('MertikWifiDriver has been initialized');
    // When udp server receive message.

	// Make udp server listen on port 8089.
	this.udpSock.on('listening', function () {
		// Get and print udp server listening ip address and port number in log console. 
		var address = this.address(); 
		console.log('UDP Server started and listening on ' + address.address + ":" + address.port);
		//Sending sync once in the hope of an early fetch.
		this.setBroadcast(true);
		this.send(reqSync,0,reqSync.length,30718,'255.255.255.255');
	});

	this.udpSock.on("message", function (buffer,rinfo) {
	    var message = buffer.toString();
		// Print received message in stdout, here is log console.
		console.log("Udp server receive message : " + message.substring(13,24) + "\n");
		if (message.substring(13,24) == "mmWiFiBoxV2") {
		  self.devices[self.devices.length] = {
			"data": { 
				"id": rinfo.address
			},
			"name": "Mertik WiFiBox",
			"settings": {}
		  };
		}
	});

	this.udpSock.bind(30719,'255.255.255.255');

    //-----------------------------------------------
    //-------------- ACTIONS ------------------------
    
	// new Homey.FlowCardAction('fan_speed_set').register().registerRunListener((args, state) => {
// 		return args.my_device.setFanSpeed(args.fan_speed);
//   	});   
//   	
// 	new Homey.FlowCardAction('thermostat_mode_set').register().registerRunListener((args, state) => {
// 		return args.my_device.setInnovaMode(args.thermostat_mode);
//   	});     	     
// 
// 	new Homey.FlowCardAction('night_mode_on').register().registerRunListener((args, state) => {
// 		return args.my_device.nightModeOn();
//   	});
//   	
//   	new Homey.FlowCardAction('night_mode_off').register().registerRunListener((args, state) => {
// 		return args.my_device.nightModeOff();
//   	});
// 
// 	new Homey.FlowCardAction('night_mode_toggle').register().registerRunListener((args, state) => {
// 		if (args.my_device.getCapabilityValue('night_mode'))
// 		  return args.my_device.nightModeOff();
// 		else  
// 		  return args.my_device.nightModeOn();		
//   	});
//   	
//   	new Homey.FlowCardAction('flap_rotate_on').register().registerRunListener((args, state) => {
// 		return args.my_device.flapRotateOn();
//   	});
//   	
//   	new Homey.FlowCardAction('flap_rotate_off').register().registerRunListener((args, state) => {
// 		return args.my_device.flapRotateOff();
//   	});
//   	
//   	new Homey.FlowCardAction('flap_rotate_toggle').register().registerRunListener((args, state) => {
// 		if (args.my_device.getCapabilityValue('flap_rotate'))
// 		  return args.my_device.flapRotateOff();
// 		else  
// 		  return args.my_device.flapRotateOn();		
//   	});
//   	
    //-----------------------------------------------
    //-------------- TRIGGERS -----------------------

    // this.triggerFlapRotateOn = 	 	new Homey.FlowCardTriggerDevice('flap_rotate_on').register();
//     this.triggerFlapRotateOff = 	new Homey.FlowCardTriggerDevice('flap_rotate_off').register();
//     this.triggerFlapRotateToggle = 	new Homey.FlowCardTriggerDevice('flap_rotate_toggled').register();        
//     this.triggerNightModeOn = 	 	new Homey.FlowCardTriggerDevice('night_mode_on').register();
//     this.triggerNightModeOff = 	 	new Homey.FlowCardTriggerDevice('night_mode_off').register();
//     this.triggerNightModeToggle = 	new Homey.FlowCardTriggerDevice('night_mode_toggled').register();        
// 	this.triggerFanSpeed = 		 	new Homey.FlowCardTriggerDevice('fan_speed_changed').register().registerRunListener((args, state) => {
// 	  this.log(args);
// 	  this.log(state);	  
// 		if (args.my_device.getCapabilityValue('flap_rotate'))
// 		  return args.my_device.flapRotateOff();
// 		else  
// 		  return args.my_device.flapRotateOn();		
//   	});
//   	
//     this.triggerModeChanged = 		new Homey.FlowCardTriggerDevice('thermostat_mode_changed').register().registerRunListener((args, state) => {
// 		if (args.my_device.getCapabilityValue('flap_rotate'))
// 		  return args.my_device.flapRotateOff();
// 		else  
// 		  return args.my_device.flapRotateOn();		
//   	});

  	
    //-------------------------------------------------
    //-------------- CONDITIONS -----------------------    
  	// new Homey.FlowCardCondition('fan_speed_is').register().registerRunListener((args, state) => {
// 	  return args.my_device.getCapabilityValue('fan_speed');
//   	});
//   	
//   	new Homey.FlowCardCondition('flap_rotate_is').register().registerRunListener((args, state) => {
// 	  return args.my_device.getCapabilityValue('flat_rotate');
//   	});
//   	
//   	new Homey.FlowCardCondition('night_mode_is').register().registerRunListener((args, state) => {
// 	  return args.my_device.getCapabilityValue('night_mode');
//   	});
//   	
//   	new Homey.FlowCardCondition('thermostat_mode_is').register().registerRunListener((args, state) => {
// 	  return args.my_device.getCapabilityValue('thermostat_mode');
//   	});
  };

  
  async onPair(socket) {
    var self = this;
    // this is called when the user presses save settings button in start.html
	socket.on("get_devices", async function (data, callback) {
		this.devices = self.devices;
		console.log("MertikWifi app - get_devices data: " + JSON.stringify(data));
		console.log("MertikWifi app - get_devices devices: " + JSON.stringify(self.devices));
		var cnt = 60;
        var intv = setInterval(function(){
   		  console.log("MertikWifi app - get_devices devices: " + JSON.stringify(self.devices));
          cnt--;
          if (self.devices.length > 0) {
 			console.log("MertikWifi app - found device, listing devices.");
	        clearInterval(intv);
 			socket.emit("found", null);
          }else
          if (cnt <= 0) {
            clearInterval(intv);
            socket.emit("not_found", null);		
 			console.log("MertikWifi app - response is not ok");
          }else{
            //Broadcast a sync request (to wich the WifiBox should reply)
			self.udpSock.send(reqSync,0,reqSync.length,30718,'255.255.255.255');
          }
        },1000);
	});

	// this method is run when Homey.emit('list_devices') is run on the front-end
	// which happens when you use the template `list_devices`
	// pairing: start.html -> get_devices -> list_devices -> add_devices
	socket.on("list_devices", function (data, callback) {
		console.log("MertikWifi app - list_devices data: " + JSON.stringify(data));
		console.log("MertikWifi app - list_devices devices: " + JSON.stringify(self.devices));

		callback(null, this.devices);
	});
  };	
	
  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [];
  }
}

module.exports = MertikWifiDriver;