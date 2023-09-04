const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const Workfront = require('workfront-api')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('** CREATE OFFER **')
    logger.info("Brief: " + params.brief)
    logger.info("Audience Count: " + params.audiencecount)
    logger.info("Audiences: " + params.audiences)

    const instance = new Workfront.NodeApi({
      url: params.WORKFRONT_URL,
      apiKey: params.WORKFRONT_API_KEY
    });

    offername = params.name
    // offertitle = params.title
    // offerdescription = params.description
    offerbrief = params.brief
 
    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)
    const apiEndpoint =  params.AEM_AUTHOR + params.AEM_OFFER_PATH + offername

    let titleVariations = {};
    let descriptionVariations = {};
    const variationNames = Object.keys(params.offers);
    console.log("Variation names: " + variationNames)
    for (let index = 1; index < variationNames.length; index++) {
      const variationName = variationNames[index]
      console.log("Variation Name: " + variationName)
      const variation = params.offers[variationName];
      console.log(variation)
      titleVariations[variationName.replace(/ /g, '-')] = {
        value: variation.headline,
        title: variationName,
        description: offerbrief
      }
      descriptionVariations[variationName.replace(/ /g, '-')] = {
        value: variation.description,
        title: variationName,
        description: offerbrief
      }
    }
      
    cfbody = {    
          "properties": {
            "elements": {
              "headline": {
                "value": params.offers.default.headline,
                "variations": titleVariations
              },
              "detail" : {
                "value": params.offers.default.description,
                "variations": descriptionVariations
              }
          },
          "contentFragment": true,
          "description": offerbrief,
          "title": params.offers.default.headline,
          "name": offername,
          "cq:model": "/conf/securbank/settings/dam/cfm/models/offer"
        }
    }

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

    const taskUrl = `https://experience.adobe.com/#/@ags050/custom-apps/28538-519LimeMoose/?cf=%2Fcontent%2Fdam%2Fsecurbank%2Fen%2Foffers%2F${offername}&variation=main#/`;

    instance.create('TASK', {"projectID":"63102cdc005a4d1c2c44b9c627ff2a4c","name":"Review offer - " + params.offers.default.headline,"description":params.offers.default.description,"priority":2,"plannedCompletionDate":null,"assignments":[{"assignedToID":"b65b4f9d3e7b4b3d843bb99c9d6787f9"}],"URL": taskUrl,"duration":"5","durationType":"S","isDurationLocked":true}).then(
        function(data) {
        console.log('Created a task');
      },
      function(error) {
        console.log('Login failure. Received data:');
        console.log(error);
      }
    )

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


    result = offername + ' Content Fragment created'
  
    const response = {
      statusCode: 200,
      body: result
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
