import { actionWebInvoke } from "./utils";
import actions from './config.json'

export async function invokeFireflyAction (fireflyPrompt, props) {
  console.log("Firefly Action invoked")
  const headers =  {}
  const params =  { prompt: fireflyPrompt}
  // set the authorization header and org from the ims props object
  if (props.ims.token && !headers.authorization) {
      headers.authorization = `Bearer ${props.ims.token}`
  }
  if (props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = props.ims.org
  }

  try {
    const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCreative"], headers, params);
    const fireflyResponse = actionResponse.map((image) => ({id: actionResponse.indexOf(image), image: image.imageUrl, name: image.name}));
    return fireflyResponse;
  } catch (e) {
    console.error(e)
    return {error: 'Finished with errors'};
  }
}

export async function invokeFirefallAction (prompt, toneOfVoice, props) {
  const headers =  {};
  const params =  { prompt: prompt, toneOfVoice: toneOfVoice ? toneOfVoice : 'neutral'};
  // set the authorization header and org from the ims props object
  if (props.ims.token && !headers.authorization) {
      headers.authorization = `Bearer ${props.ims.token}`
  }
  if (props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = props.ims.org
  }

  try {
    const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params);
    const reviewedContent = await reviewContent(actionResponse, toneOfVoice, props);

    return reviewedContent;
  } catch (e) {
    console.error(e)
    return {error: 'Finished with errors'};
  }
}

async function reviewContent(content, toneOfVoice, props, maxReviewCount = 2) {
  let approved = false;
  let reviewCount = 0;

  while(!approved && reviewCount < maxReviewCount) {
      const headers =  {}
      const params =  { prompt: 'Offer title is "' + content.title + '" and description is "' + content.description + '"', toneOfVoice: toneOfVoice ? toneOfVoice : 'neutral', action: 'review'}
      // set the authorization header and org from the ims props object
      if (props.ims.token && !headers.authorization) {
          headers.authorization = `Bearer ${props.ims.token}`
      }
      if (props.ims.org && !headers['x-gw-ims-org-id']) {
          headers['x-gw-ims-org-id'] = props.ims.org
      }

      try {
          const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
          if(actionResponse.approval === 'approved') {
              approved = true;
              return {title: actionResponse.approvedTitle, description: actionResponse.approvedDescription}
          } else {
              reviewCount++;
              content.title = actionResponse.alternativeTitle;
              content.description = actionResponse.alternativeDescription;
          }
      
      } catch (e) {
          return content;
      }
  }

  return content;
}

async function invokePromptCreatorAction (description, props) {
    const headers =  {}

    const params =  { prompt: "generate keywords from this statement: " + description};
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
        headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = props.ims.org
    }

    try {
      const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
      return actionResponse;
    } catch (e) {
      console.error(e)
      return {error: 'Finished with errors'};
    }
  }

export async function invokePromptGeneratorAction (description, props) {
    const data = await invokePromptCreatorAction(description, props);

    const headers =  {}
    const params =  { 
      prompt: "Generate an image prompt for the following keywords: " + data.toString(), 
      isSystem: true, 
      systemPrompt: [
          "Generate an image prompt for an AI art bot. Create an image prompt that I can use with the Firefly AI art bot.", 
          "The images should always have a person as the main subject.", 
          "I will give you a sentence of what I have in mind, and then you generate the image prompts based on the following format: [type of art], [subject or topic], [action or activity], [aesthetic details, lighting, and styles], [colors] and return it as a single text line.", 
          "Example Image Prompt: line art, a sharp-dressed person, deep in thought, calm background with lots of summer, bright colors, monochrome."]}
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
        headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = props.ims.org
    }

    try {
      const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
      let response = "";
      for (let x in actionResponse) {
          response += actionResponse[x] + ", ";
      }
      return response;
    } catch (e) {
      console.error(e)
      return {error: 'Finished with errors'};
    }
}

export async function invokeRemixAudienceAction(name, description, props) {
  const headers =  {}

  const params =  { prompt: "generate new audiences based on the following audience, name: " + name + " and description: " + description};
  // set the authorization header and org from the ims props object
  if (props.ims.token && !headers.authorization) {
    headers.authorization = `Bearer ${props.ims.token}`
  }
  if (props.ims.org && !headers['x-gw-ims-org-id']) {
    headers['x-gw-ims-org-id'] = props.ims.org
  }

  try {
    const actionResponse = await actionWebInvoke(actions["dx-excshell-1/remixAudience"], headers, params)
    return actionResponse;
  } catch (e) {
    console.error(e)
    return {error: 'Finished with errors'};
  }
}
