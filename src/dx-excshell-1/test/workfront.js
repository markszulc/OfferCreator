'use strict';
const Workfront = require('workfront-api');
    

const instance = new Workfront.NodeApi({
    url: 'https://emea08082201.testdrive.workfront.com',
    apiKey: 'awt186gfdz2672afw1eqaihzf1enhbmv'
});

instance.create('TASK', {"projectID":"63102cdc005a4d1c2c44b9c627ff2a4c","name":"DELETE3","description":"","priority":2,"plannedCompletionDate":null,"assignments":[{"assignedToID":"b65b4f9d3e7b4b3d843bb99c9d6787f9"}],"URL": "https://www.google.com","duration":"5","durationType":"S","isDurationLocked":true}).then(
    function(data) {
		console.log('Created a task');
	},
	function(error) {
		console.log('Login failure. Received data:');
		console.log(error);
	}
)
