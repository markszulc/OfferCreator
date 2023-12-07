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

    const configuration = new Configuration({
      apiKey:  params.CHAT_GPT_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    aiPrompt = params.prompt;
    let messages = [];

    messages.push({role: "user", content: 'Imagine you are tasked to identify suitable audiences for a marketing campaig. I will provide the name and description of the existing audience and I want you to generate 3 additional segments based on gender, geolocation and age. For segments based on geolocation assume that you are located in Australia. You will only return the name and description of these new segments.'})
    messages.push({role: "user", content: "Your responses will be in a JSON array with each element of the array being a JSON object with fields for the name and description of the new segment"})

    messages.push({role: "user", content: aiPrompt});
    
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
