const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('** COPY & RENAME EXPERIENCE FRAGMENT **')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = [/* add required params */]
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)
    const apiEndpoint = params.AEM_AUTHOR + params.AEM_OFFER_ENDPOINT;

    xfName = params.xfname;
    xfTitle = params.xfname;
    xfDescription = params.xfdescription;

    //START Copy JCR Node
    const copyNodeEndpoint =  params.AEM_AUTHOR + params.AEM_XF_SOURCE_PATH;
    logger.info('DEST: ' + params.AEM_XF_DESTINATION_PATH + xfName);
    logger.info('SOURCE: ' + copyNodeEndpoint);
    

    const res = await fetch(copyNodeEndpoint, {
      method: 'post',
      headers: {
          'Authorization': 'Bearer ' + token,
          'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        ':operation': 'copy',
        ':dest': params.AEM_XF_DESTINATION_PATH + xfName
      })
    })

    if (!res.ok) {
      throw new Error('request to ' + copyNodeEndpoint + ' failed with status code ' + res.status)
    }
   
    //END Copy JCR Node

    //START Modify XF to point to CF
    const xfVariations = params.AEM_XF_VARIATIONS_LIST.split(',');
    xfVariations.forEach(async variation => {
        const variationEndpoint = params.AEM_AUTHOR + params.AEM_XF_DESTINATION_PATH + xfName + '/' + variation + '/jcr:content/root//contentfragment'
        logger.info('VARIATION: ' + variationEndpoint);
        const postParams = new URLSearchParams();
        postParams.append('fragmentPath', "/content/dam/securbank/en/offers/" + xfName)

        const res = await fetch(variationEndpoint, {
            method: 'post',
            headers: {
                'Authorization': 'Bearer ' + token,
                'content-type': 'application/x-www-form-urlencoded'
      
            },
            body: postParams
        })
        if (!res.ok) {
            throw new Error('request to ' + variationEndpoint + ' failed with status code ' + res.status)
        }
    });
    //END Modify XF to point to CF


    //START Change XF Title and Description
    const xfEndpoint = params.AEM_AUTHOR + params.AEM_XF_DESTINATION_PATH + xfName + '/jcr:content'
    logger.info('xfEndpoint: ' + xfEndpoint);
    
    const xfRes = await fetch(xfEndpoint, {
        method: 'post',
        headers: {
            'Authorization': 'Bearer ' + token,
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'jcr:title': xfTitle,
          'jcr:description': xfDescription
        })
    })
    if (!xfRes.ok) {
        throw new Error('request to ' + xfEndpoint + ' failed with status code ' + xfRes.status)
    }
    //END 

    //START Modify CF metadata
    const offerFragmentEndpoint = params.AEM_AUTHOR + "/content/dam/securbank/en/offers/" + xfName + '/jcr:content/metadata'
    const offerPostParams = new URLSearchParams();
    offerPostParams.append('processed', 'true')

    const offerRes = await fetch(offerFragmentEndpoint, {
        method: 'post',
        headers: {
            'Authorization': 'Bearer ' + token,
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'xfcreated': 'true'
        })
    })
    if (!offerRes.ok) {
        throw new Error('request to ' + variationEndpoint + ' failed with status code ' + res.status)
    }
    //END Modify CF metadata

  
    const response = {
      statusCode: 200,
      body: "Good"
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
