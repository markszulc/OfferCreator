const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const fs = require('fs');
const filesLib = require('@adobe/aio-lib-files')

async function createFireflyCredentials(clientId, clientSecret, scope='openid,AdobeID,firefly_api') {
  const apiEndpoint = 'https://ims-na1.adobelogin.com/ims/token/v3';
  const form = new URLSearchParams();
  form.append('grant_type', 'client_credentials');
  form.append('client_id', clientId);
  form.append('client_secret', clientSecret);
  form.append('scope', scope);
  const res = await fetch(apiEndpoint, {
    method: 'POST',
    body: form
  })

  if (!res.ok) {
    throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
  }
  const content = await res.json();
  return content.access_token;
}

async function generateCreative(prompt, clientId, token) {
  const logger = Core.Logger('generateCreative', { level: 'debug' })
  const apiEndpoint = 'https://firefly-beta.adobe.io/v1/images/generations';

  const data = {
    "size": "1792x1024",
    "n": 2,
    "prompt": prompt,
    "styles": [
        "hyper realistic"
    ],
    "contentClass": "photo"
  }

  logger.info("Req body: " + JSON.stringify(data));

  const res = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'X-Api-Key': clientId,
        'Accept': 'application/json+base64',
        'content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
  }
  const content = await res.json();

  logger.info("Firefly response: " + content.pipelineVersion);

  return content.images;
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {

  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('** GENERATE CREATIVE **')
    logger.info(params.FIREFLY_CLIENT_ID)
    logger.info(params.FIREFLY_CLIENT_SECRET)
    logger.info(params.prompt)

    const token = await createFireflyCredentials(params.FIREFLY_CLIENT_ID, params.FIREFLY_CLIENT_SECRET);
    const images = await generateCreative(params.prompt, params.FIREFLY_CLIENT_ID, token)
    const files = await filesLib.init();
    const res = []

    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      const imageData = image.base64;
      const fileNameTS = Date.now() + '.png'

      fs.writeFileSync(fileNameTS, imageData, {encoding: 'base64'}, (err) => {
        if (err) throw err;
        logger.log('Saved the generated image!');
      });
  
      const stats = fs.statSync(fileNameTS);
      var data = fs.readFileSync(fileNameTS);

      await files.write('tmp/'+fileNameTS, data)
      const presignUrl = await files.generatePresignURL('tmp/'+fileNameTS, { expiryInSeconds: 3600 })
      res.push({name: fileNameTS, imageUrl: presignUrl});
    }

    if(!token) {
      throw new Error('Token is not generated');
    }

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
