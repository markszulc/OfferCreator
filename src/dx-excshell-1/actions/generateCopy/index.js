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
    logger.info("Tone Of Voice: " + params.toneOfVoice)
    logger.info("System input: " + params.isSystem)

    const configuration = new Configuration({
      apiKey:  params.CHAT_GPT_KEY,
    });
    const openai = new OpenAIApi(configuration);
    
    aiPrompt = params.prompt;
    let messages = [];

    if(params.action === 'review') {
      messages.push({role: "user", content: 'Imagine you are a copywriter for a large bank. You are tasked with reviewing some offer copy. A typical offer consists of a title and a description. An example of an offer title is "$0 fee everyday account" and of an offer description is "Save money with no monthly account fees on our SecurBank Classic Banking Account.". When I provide offer title and description I want you to review it and either approve it for use or provide alternatives. Provide your response in JSON format. If you approve the title or description your response must contain the following fields: approval, approvedTitle, approvedDescription. The approval field must have a value of "approved". The approvedTitle field must contain the approved title. The approvedDescription field must contain the approved description. If you do not approve the title or description your response must contain the following fields: approval, alternativeTitle, alternativeDescription. The approval field must have a value of "not approved". The appralternativeTitleovedTitle field must contain the suggested title. The alternativeDescription field must contain the suggested description'})
    } else {
      if(params.toneOfVoice) {
        aiPrompt += " in a " + params.toneOfVoice + " voice";
      }
  
      if(params.isSystem) {
        for (let index = 0; index < params.systemPrompt.length; index++) {
          const sysPrompt = params.systemPrompt[index];
          messages.push({role: "user", content: sysPrompt})
        }
      }
        
      messages.push({role: "user", content: "Your responses will be in a JSON format"})
    }

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
