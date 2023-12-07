/*
* <license header>
*/

/* global fetch */

/**
 *
 * Invokes a web action
 *
 * @param  {string} actionUrl
 * @param {object} headers
 * @param  {object} params
 *
 * @returns {Promise<string|object>} the response
 *
 */

export async function actionWebInvoke (actionUrl, headers = {}, params = {}, options = { method: 'POST' }) {  
  const actionHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  const fetchConfig = {
    headers: actionHeaders
  }

  if (window.location.hostname === 'localhost') {
    actionHeaders['x-ow-extra-logging'] = 'on'
  }

  fetchConfig.method = options.method.toUpperCase()

  if (fetchConfig.method === 'GET') {
    actionUrl = new URL(actionUrl)
    Object.keys(params).forEach(key => actionUrl.searchParams.append(key, params[key]))
  } else if (fetchConfig.method === 'POST') {
    fetchConfig.body = JSON.stringify(params)
  }
  
  const response = await fetch(actionUrl, fetchConfig)

  let content = await response.text()
  
  if (!response.ok) {
    throw new Error(`failed request to '${actionUrl}' with status: ${response.status} and message: ${content}`)
  }
  try {
    content = JSON.parse(content)
  } catch (e) {
    // response is not json
  }
  return content
}

export async function actionWebInvoke64 (actionUrl, headers = {}, params = {}, options = { method: 'POST' }) {  
  const actionHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json+base64',
    ...headers
  }

  const fetchConfig = {
    headers: actionHeaders
  }

  if (window.location.hostname === 'localhost') {
    actionHeaders['x-ow-extra-logging'] = 'on'
  }

  fetchConfig.method = options.method.toUpperCase()

  if (fetchConfig.method === 'GET') {
    actionUrl = new URL(actionUrl)
    Object.keys(params).forEach(key => actionUrl.searchParams.append(key, params[key]))
  } else if (fetchConfig.method === 'POST') {
    fetchConfig.body = JSON.stringify(params)
  }
  
  const response = await fetch(actionUrl, fetchConfig)

  let content = await response.text()
  
  if (!response.ok) {
    throw new Error(`failed request to '${actionUrl}' with status: ${response.status} and message: ${content}`)
  }
  try {
    content = JSON.parse(content)
  } catch (e) {
    // response is not json
  }
  return content
}

export const doFetch = (url, token = null, method = "GET") => {
  const header = new Headers();
  if(!token) {
      // get the bearer token either from window/wherever you are storing it from registerAssetsSelectorsAuthService
      header.append("Authorization", `Bearer ${window['assetsSelectorsAuthService'].imsToken}`);
  }
  const requestOptions = {
      method: method,
      headers: header,
  };
  return fetch(url, requestOptions);
};

// fetch the asset rendition and return the blob url
export const getRenditionBlob = async (renditionUrl) => {
  const response = await doFetch(renditionUrl);
  const buffer = await response.arrayBuffer();
  return URL.createObjectURL(new Blob([new Uint8Array(buffer)]));
};

// Very basic way to get the optimal rendition link based on the height x width
export const getOptimalRenditionLink = (renditions) => {
  return renditions.reduce((optimalRendition, currentRendition) => {
      const optimalResolution = optimalRendition.width * optimalRendition.height;
      const currentResolution = currentRendition.width * currentRendition.height;
      return currentResolution > optimalResolution ? currentRendition : optimalRendition;
    });
}

export const getAssetRenditionLinks = (selectedAssets) => {
  const asset = selectedAssets?.[0];
  return asset?._links?.['http://ns.adobe.com/adobecloud/rel/rendition'];
};
