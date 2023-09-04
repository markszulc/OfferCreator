const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')
const { Configuration, OpenAIApi } = require("openai");
// const OpenAI = require('openai');

// main function that will be executed by Adobe I/O Runtime
async function main (params) {

  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('** GENERATE COPYWRITE **')
    logger.info("Prompt: " + params.prompt)
    logger.info("Audiences: " + params.audiences)

    let audiences = "default"
    if(params.audiences) {
      for (let index = 0; index < params.audiences.length; index++) {
        const element = params.audiences[index];
        audiences = audiences.concat(",", element.toLowerCase());
      }
    }

    const configuration = new Configuration({
      apiKey:  params.CHAT_GPT_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    aiPrompt = "As a JSON object, " + params.prompt + " aimed at the following audiences: " + audiences

    const messages = [{role: "user", content: aiPrompt}]

    const chatCompletion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
    console.log("AI Response generated: " + JSON.stringify(chatCompletion.data.choices[0].message.content));

    const response = {
      statusCode: 200,
      body: chatCompletion.data.choices[0].message.content
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
