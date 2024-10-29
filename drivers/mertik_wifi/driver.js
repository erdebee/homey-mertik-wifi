'use strict';

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
			"name": "Mertik WiFiBox - Autodiscovered",
			"settings": {}
		  };
		}
	});

	this.udpSock.bind(30719,'255.255.255.255');

    //-----------------------------------------------
    //-------------- ACTIONS ------------------------
    
	this.homey.flow.getActionCard('operation_mode_set').registerRunListener((args, state) => {
		return args.my_device.setOperationMode(args.operation_mode);
  	});  
  	
  	this.homey.flow.getActionCard('flame_height_set').registerRunListener((args, state) => {
		return args.my_device.setFlameHeight(args.flame_height);
  	});   
  	
	this.homey.flow.getActionCard('dual_flame_on').registerRunListener((args, state) => {
		return args.my_device.auxOn();
  	});
  	
  	this.homey.flow.getActionCard('dual_flame_off').registerRunListener((args, state) => {
		return args.my_device.auxOff();
  	});

	this.homey.flow.getActionCard('dual_flame_toggle').registerRunListener((args, state) => {
		if (args.my_device.getCapabilityValue('dual_flame'))
		  return args.my_device.auxOff();
		else  
		  return args.my_device.auxOn();		
  	});

    //-----------------------------------------------
    //-------------- TRIGGERS -----------------------

     this.triggerDualFlameOn = 	 	this.homey.flow.getDeviceTriggerCard('dual_flame_on');
     this.triggerDualFlameOff = 	this.homey.flow.getDeviceTriggerCard('dual_flame_off');
     this.triggerDualFlameToggle = 	this.homey.flow.getDeviceTriggerCard('dual_flame_toggled');        
     this.triggerFlameHeightChanged = 	this.homey.flow.getDeviceTriggerCard('flame_height_changed');        
     this.triggerOperationModeChanged = 	this.homey.flow.getDeviceTriggerCard('operation_mode_changed');
  	
    //-------------------------------------------------
    //-------------- CONDITIONS -----------------------    
  	this.homey.flow.getConditionCard('dual_flame_is').registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('dual_flame');
  	});
  	
  	this.homey.flow.getConditionCard('flame_height_is').registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('flame_height');
  	});
  	
  	this.homey.flow.getConditionCard('operation_mode_is').registerRunListener((args, state) => {
	  return args.my_device.getCapabilityValue('operation_mode');
  	});
  	
  };

  
  async onPair(session) {
    var self = this;
    // this is called when the user presses save settings button in start.html
	session.setHandler("get_devices", async (data) => {
		console.log("MertikWifi app - get_devices data: " + JSON.stringify(data));
		console.log("MertikWifi app - get_devices devices: " + JSON.stringify(self.devices));
		var cnt = 60;
        var intv = setInterval(async function(){
   		  console.log("MertikWifi app - get_devices devices: " + JSON.stringify(self.devices));
          cnt--;
          if (self.devices.length > 0) {
 			console.log("MertikWifi app - found device, listing devices.");
	        clearInterval(intv);
 			//socket.emit("found", null);
      		await session.showView('list_devices');
          }else
          if (cnt <= 0) {
            clearInterval(intv);
            //socket.emit("not_found", null);		
 			console.log("MertikWifi app - response is not ok");
          }else{
            //Broadcast a sync request (to wich the WifiBox should reply)
			self.udpSock.send(reqSync,0,reqSync.length,30718,'255.255.255.255');
          }
        },1000);
	});
	
	session.setHandler("add_manual", async (data) => {
		this.devices = self.devices;
		console.log("MertikWifi app - add_manual data: " + JSON.stringify(data));
		  self.devices[self.devices.length] = {
			"data": { 
				"id": data.ip
			},
			"name": "Mertik WiFiBox - Manual",
			"settings": {}
		  };		
		console.log("MertikWifi app - add_manual devices: " + JSON.stringify(self.devices));
		await session.showView('list_devices');
	});

	// this method is run when Homey.emit('list_devices') is run on the front-end
	// which happens when you use the template `list_devices`
	// pairing: start.html -> get_devices -> list_devices -> add_devices
	session.setHandler("list_devices", async (data) => {
		console.log("MertikWifi app - list_devices data: " + JSON.stringify(data));
		console.log("MertikWifi app - list_devices devices: " + JSON.stringify(self.devices));

		return await this.onPairListDevices(session);
	});
  };	
	
  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return this.devices;
  }
}

module.exports = MertikWifiDriver;
