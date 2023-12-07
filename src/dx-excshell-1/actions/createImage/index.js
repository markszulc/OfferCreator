const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const DirectBinary = require('@adobe/aem-upload');
const { Blob, Buffer } = require('node:buffer'); 
const filesLib = require('@adobe/aio-lib-files')
const fs = require('fs');
const Workfront = require('workfront-api')
// import dashify from 'dashify';

const calcImageSize = (imageData) => {
  const base64String = "data:image/png;base64," + imageData;

  const stringLength = base64String.length - 'data:image/png;base64,'.length;

  const sizeInBytes = Math.ceil(stringLength / 4) * 3;
  return sizeInBytes;
}

const b64toBlob = (dataURI, contentType='image/png', sliceSize=512) => {
  const byteCharacters = Buffer.from(dataURI, 'base64');
  var arrByte= new Uint8Array(Buffer.from(byteCharacters))
  var blob= new Blob([arrByte])
  console.log('Image blob', blob)
  return blob;
}

const uploadImages = async (size, fileName, AEM_AUTHOR, token, offerName) => {
  const uploadFiles = [
    {
        fileName: fileName, // name of the file as it will appear in AEM
        fileSize: size, // total size, in bytes, of the file
        filePath: fileName // Image blob
    }
  ];
  let options = new DirectBinary.DirectBinaryUploadOptions()
    .withUrl(AEM_AUTHOR + "/content/dam/securbank/en/stock/" + offerName)
    .withUploadFiles(uploadFiles)
    .withHeaders({Authorization: 'Bearer ' + token});
  
  const upload = new DirectBinary.DirectBinaryUpload();

  const result = await upload.uploadFiles(options)

  const { detailedResult = [] } = result;

  console.log(detailedResult)

  return '/content/dam/securbank/en/stock/' + offerName + '/' + fileName;
}

async function generateCreative(prompt, clientId, token) {
  const apiEndpoint = 'https://firefly-beta.adobe.io/v1/images/generations';

  const data = {
    "size": "1792x1024",
    "n": 1,
    "seeds": [
      9865
     ],
    "prompt": prompt,
    "styles": [
        "hyper realistic"
    ],
    "contentClass": "photo"
  }

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

  console.log('Made request to Firefly');
  if (!res.ok) {
    throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
  }
  const content = await res.json();

  return content.images[0].base64;
}

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  const files = await filesLib.init()
  try {
    // 'info' is the default level if not set
    logger.info('** CREATE OFFER **')
    const imageUrl = params.selectedImage;
    const data = await fetch(imageUrl)
    const buffer = await data.buffer();
    const fileNameTS = params.name + '-' + Date.now() + '.png'

    fs.writeFileSync(fileNameTS, buffer, (err) => {
      if (err) throw err;
      logger.log('Saved the generated image!');
    });

    const token = getBearerToken(params)

    const folderBody = {class:"assetFolder",properties:{title:params.offerName}};
    const createFolderRes = await fetch(params.AEM_AUTHOR + "/api/assets/securbank/en/stock/" + params.offerName, {
      method: 'post',
      body: JSON.stringify(folderBody),
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    const folderData = await createFolderRes.json();

    const stats = fs.statSync(fileNameTS);
    const imagePath = await uploadImages(stats.size, fileNameTS, params.AEM_AUTHOR, token, params.offerName)
    const stream = fs.createReadStream(fileNameTS)
    const instance = new Workfront.NodeApi({
      url: params.WORKFRONT_URL,
      apiKey: params.WORKFRONT_API_KEY
    });
    const wfData = await instance.uploadFromStream(stream, fileNameTS);
    instance.create('TASK', {"projectID":"63102cdc005a4d1c2c44b9c627ff2a4c","name":"Production image generation - audience: " + params.name,"description":"Generate a production version of this image. The prompt used was: " + params.prompt,"priority":2,"plannedCompletionDate":null,"assignments":[{"assignedToID":"b65b4f9d3e7b4b3d843bb99c9d6787f9"}],"duration":"5","durationType":"S","isDurationLocked":true}).then(
      function(data) {
        console.log('Created a task');
        instance
          .create('DOCU', {
              name: fileNameTS,
              handle: wfData.handle,
              docObjCode: 'TASK',

              //Obviously this will only work with a real TASK ID
              objID: data.ID,
          })
          .then(
              function (data) {
                  console.log('Document creation success. Received data:')
              },
              function (error) {
                  console.log('Document creation failure. Received data:')
              }
          )
      },
      function(error) {
        console.log('Login failure. Received data:');
        console.log(error);
      }
  )
    fs.unlinkSync(fileNameTS);
 
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
      body: imagePath
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
