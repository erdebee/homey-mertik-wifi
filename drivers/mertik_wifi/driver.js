'use strict';

const net = require('net');

const dgram = require('dgram');

const Homey = require('homey');

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
    
	new Homey.FlowCardAction('operation_mode_set').register().registerRunListener((args, state) => {
		return args.my_device.setOperationMode(args.operation_mode);
  	});  
  	
  	new Homey.FlowCardAction('flame_height_set').register().registerRunListener((args, state) => {
		return args.my_device.setFlameHeight(args.flame_height);
  	});   
  	
	new Homey.FlowCardAction('dual_flame_on').register().registerRunListener((args, state) => {
		return args.my_device.auxOn();
  	});
  	
  	new Homey.FlowCardAction('dual_flame_off').register().registerRunListener((args, state) => {
		return args.my_device.auxOff();
  	});

	new Homey.FlowCardAction('dual_flame_toggle').register().registerRunListener((args, state) => {
		if (args.my_device.getCapabilityValue('dual_flame'))
		  return args.my_device.auxOff();
		else  
		  return args.my_device.auxOn();		
  	});

    //-----------------------------------------------
    //-------------- TRIGGERS -----------------------

     this.triggerDualFlameOn = 	 	new Homey.FlowCardTriggerDevice('dual_flame_on').register();
     this.triggerDualFlameOff = 	new Homey.FlowCardTriggerDevice('dual_flame_off').register();
     this.triggerDualFlameToggle = 	new Homey.FlowCardTriggerDevice('dual_flame_toggled').register();        
     this.triggerFlameHeightChanged = 	new Homey.FlowCardTriggerDevice('flame_height_changed').register();        
     this.triggerOperationModeChanged = 	new Homey.FlowCardTriggerDevice('operation_mode_changed').register();        


  	
    //-------------------------------------------------
    //-------------- CONDITIONS -----------------------    
  	new Homey.FlowCardCondition('dual_flame_is').register().registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('dual_flame');
  	});
  	
  	new Homey.FlowCardCondition('flame_height_is').register().registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('flame_height');
  	});
  	
  	new Homey.FlowCardCondition('operation_mode_is').register().registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('operation_mode');
  	});
  	
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