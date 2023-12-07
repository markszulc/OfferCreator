const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const Workfront = require('workfront-api')

const createContentFragments = async (items, params) => {
  const offerName = params.offerName;
  let defaultContent = {};
  let titleVariations = {};
  let descriptionVariations = {};
  let heroImageVariations = {};
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    
    if(item.name === 'Default') {
      defaultContent.title = item.firefallReponse.title
      defaultContent.description = item.firefallReponse.description
      defaultContent.heroImage = item.imagePath
    } else {
      titleVariations[item.name.toLowerCase().replace(/\s/g, '-')] = {
        value: item.firefallReponse.title,
        title: item.name,
        description: (item.description && item.description.keywords) ? item.description.keywords.toString() : ""
      };
      descriptionVariations[item.name.toLowerCase().replace(/\s/g, '-')] = {
        value: item.firefallReponse.description,
        title: item.name,
        description: (item.description && item.description.keywords) ? item.description.keywords.toString() : ""
      };
      heroImageVariations[item.name.toLowerCase().replace(/\s/g, '-')] = {
        value: item.imagePath,
        title: item.name,
        description: (item.description && item.description.keywords) ? item.description.keywords.toString() : ""
      }
    }
  }

  const cfbody = {    
    "properties": {
      "elements": {
        "headline": {
          "value": defaultContent.title,
          "variations": titleVariations
        },
        "detail" : {
          "value": defaultContent.description,
          "variations": descriptionVariations
        },
        "heroImage": {
          "value": defaultContent.heroImage,
          "variations": heroImageVariations
        }
      },
      "contentFragment": true,
      "description": defaultContent.description,
      "title": defaultContent.title,
      "name": ""+offerName,
      "cq:model": "/conf/securbank/settings/dam/cfm/models/offer"
    }
  };

  console.log(JSON.stringify(cfbody))

  // extract the user Bearer token from the Authorization header
  const token = getBearerToken(params)
  const apiEndpoint = params.AEM_AUTHOR + params.AEM_OFFER_PATH + offerName
  const res = await fetch(apiEndpoint, {
    method: 'post',
    headers: {
        'Authorization': 'Bearer ' + token,
        'content-type': 'application/json'

    },
    body: JSON.stringify(cfbody)
  })

  if (!res.ok) {
    throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
  }
  const content = await res.json();

  console.log("CF Created: " + JSON.stringify(content));

  const taskUrl = `https://experience.adobe.com/?repo=author-p115476-e1135027.adobeaemcloud.com#/@ags050/aem/cf/editor/content/dam/securbank/en/offers/${offerName}`;

  const instance = new Workfront.NodeApi({
    url: params.WORKFRONT_URL,
    apiKey: params.WORKFRONT_API_KEY
  });

  instance.create('TASK', {"projectID":"63102cdc005a4d1c2c44b9c627ff2a4c","name":"Review offer - " + defaultContent.title,"description":defaultContent.description,"priority":2,"plannedCompletionDate":null,"assignments":[{"assignedToID":"b65b4f9d3e7b4b3d843bb99c9d6787f9"}],"URL": taskUrl,"duration":"5","durationType":"S","isDurationLocked":true}).then(
      function(data) {
      console.log('Created a task');
    },
    function(error) {
      console.log('Login failure. Received data:');
      console.log(error);
    }
  )

  return offerName + ' Offer is created';

}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('** CREATE OFFER **')

    const res = await createContentFragments(params.cfData, params);
 
    // if (params.audiencecount > 0) {
    //   const apiEndpoint =  params.AEM_AUTHOR + "/content/dam/securbank/en/offers/" + offername + ".cfm.content.json";
    //   console.log("**** Audience Count: " + params.audiencecount)

    //   // formData: {
    //   //   ':operation': 'create',
    //   //   'variation': 'foo',
    //   //   '_charset_': 'utf-8'
    //   // }

    //   const resvar = await fetch(apiEndpoint, {
    //     method: 'post',
    //     headers: {
    //         'Authorization': 'Bearer ' + token,
    //         'content-type': 'multipart/form-data; boundary=<calculated when request is sent>'
  
    //     },
    //     body: formData
    //   })

    //   const contentvariation = await resvar.json();
    // }

    const response = {
      statusCode: 200,
      body: res
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    
    return response

  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
