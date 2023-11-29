import { ActionButton, ActionGroup, Button, Checkbox, CheckboxGroup, Content, DialogTrigger, Flex, Grid, Heading, Image, InlineAlert, Item, ListView, ProgressCircle, Radio, RadioGroup, Text, TextArea, View, Well} from "@adobe/react-spectrum";
import { useEffect, useState, useRef } from "react";
import actions from '../config.json'
import { actionWebInvoke, getRenditionBlob, getOptimalRenditionLink, getAssetRenditionLinks } from "../utils";
import fetch from "node-fetch";
import DesignPlaceholder from './svg/Placeholder.js';

import { Card, CardView, GridLayout, WaterfallLayout } from "@react-spectrum/card";

import copy from 'copy-to-clipboard';
import { AssetSelectorWrapper } from "./AssetSelectorWrapper";
import { AssetSelector } from '@quarry-connected/asset-selector';

function OfferWizard({ offerData, items, setOfferData, setItems, props }) {

    const [selected, setSelected] = useState(true);
    const [keywords, setKeywords] = useState([]);
    const [selectionString, setSelectionString] = useState('');
    const [selectedAssetMetadata, setSelectedAssetMetadata] = useState(null);
    const [assetImagePreview, setAssetImagePreview] = useState(null);
    const [optimalRendition, setOptimalRendition] = useState(null);
    const [fireflyLoading, setIsFireflyLoading] = useState(false);
    const [firefallLoading, setIsFirefallLoading] = useState(false);

    const imagePromptRef = useRef(null);
    const textPromptRef = useRef(null);

    console.log(props.ims.token)

    const imsSusiData = {
        imsClientId: 'exc_app',
        imsScope: 'additional_info.projectedProductContext,openid',
        imsOrg: '28260E2056581D3B7F000101@AdobeOrg',
        imsToken: props.ims.token,
        runningInUnifiedShell: true,
        adobeImsOptions: {
            logsEnabled: true,
            useLocalStorage: true,
        },
        modalMode: true,
        env: 'prod',
    };

    const i18nSymbol = {
        dialogTitle: 'Search for NBC assets',
        confirmLabel: 'Confirm selection',
        cancelLabel: 'Cancel',
    };

    const applyAssets = () => {
        setPlaceholderAsset(selectedAssetMetadata);
      };

    useEffect(() => {
        console.log("Should fire only once");
        console.log(items)
        if(items.length > 0) {
            const fetchData = async () => {
                const data = await invokePromptCreatorAction();
                setKeywords(data);
            }
            fetchData();
            const activeAudience = items[0];
            activeAudience.keywords = keywords;
            setOfferData({ ...offerData, activeAudience: activeAudience })
            console.log(offerData)
        } else {
            let newItems = [];
            let index = 1;
            newItems.push({id: index, name: "Default", description: offerData.keymessage});
            index++
            for (var it = offerData.selectedAudience.values(), val= null; val=it.next().value; ) {
                console.log(val);
                newItems.push({id: index, name: val});
                index++;
            }
            setItems(newItems);
            console.log(offerData)
            const fetchData = async () => {
                const data = await invokePromptCreatorAction();
                setKeywords(data);
            }
            fetchData();
            const activeAudience = newItems[0];
            activeAudience.keywords = keywords;
            setOfferData({ ...offerData, activeAudience: activeAudience })
            console.log(offerData)
        }
      }, []);

    useEffect(() => {
        console.log(items);
    }, [items]);

    const DesignPlaceholderSvg = (props) => (
        <Image
            src={DesignPlaceholder}
            alt="demo design placeholder image"
            {...props}
        />
    );

    const generatePreviewImage = async (assets) => {
        const renditionLinks = getAssetRenditionLinks(assets);
        const optimalRenditionLink = getOptimalRenditionLink(renditionLinks);
        setOptimalRendition(optimalRenditionLink);
        return await getRenditionBlob(optimalRenditionLink?.href);
    };

    const handleOnConfirm = async (assets) => {
        // setSelectedAssetMetadata(assets[0]);

        // const previewImage = await generatePreviewImage(assets);
        // setAssetImagePreview(previewImage);
        console.log("HERE")
    };

    const renderPreviewImage = (src) => {
        return (
          <Flex marginBottom="5px" maxHeight="100%" maxWidth="100%">
            <Image src={src} alt="placeholder image" objectFit="cover" />
          </Flex>
        );
    };

    async function generateCreative(prompt, clientId, token) {
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
      
        return content;
    }

    async function invokeFireflyAction () {
        console.log("Firefly Action invoked")
        setIsFireflyLoading(true);
        const headers =  {}
        const params =  { prompt: offerData.activeAudience.fireflyPrompt}
        // set the authorization header and org from the ims props object
        if (props.ims.token && !headers.authorization) {
            headers.authorization = `Bearer ${props.ims.token}`
        }
        if (props.ims.org && !headers['x-gw-ims-org-id']) {
            headers['x-gw-ims-org-id'] = props.ims.org
        }

        try {
          const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCreative"], headers, params)
          offerData.fireflyToken = actionResponse;
          console.log('Response received')
        //   const imageData = await generateCreative(offerData.activeAudience.fireflyPrompt, 'c5e2c405e2894bc7ba7afbf9bd6820ac', actionResponse);
          console.log('Response received')
        //   const images = imageData.images;
        //   const fireflyResponse = images.map((image) => ({id: images.indexOf(image), image: image}));
            const fireflyResponse = actionResponse.map((image) => ({id: actionResponse.indexOf(image), image: image.imageUrl, name: image.name}));
          console.log(fireflyResponse)
          setIsFireflyLoading(false);
          const activeAudience = offerData.activeAudience;
          activeAudience.fireflyResponse = fireflyResponse;
          setOfferData({ ...offerData, activeAudience: activeAudience})
          updateItems();
        } catch (e) {
          console.error(e)
          
        }
    }

    async function invokeFirefallAction () {
        console.log("Firefall Action invoked")
        setIsFirefallLoading(true)
        const headers =  {}
        const params =  { prompt: offerData.activeAudience.chatGPTPrompt, toneOfVoice: offerData.activeAudience.toneOfVoice ? offerData.activeAudience.toneOfVoice : 'neutral'}
        // set the authorization header and org from the ims props object
        if (props.ims.token && !headers.authorization) {
            headers.authorization = `Bearer ${props.ims.token}`
        }
        if (props.ims.org && !headers['x-gw-ims-org-id']) {
            headers['x-gw-ims-org-id'] = props.ims.org
        }

        try {
          const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
          console.log('Response received', actionResponse)
          const reviewedContent = await reviewContent(actionResponse)
          console.log(reviewedContent)
          setIsFirefallLoading(false)
          setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, firefallReponse: reviewedContent }})
          updateItems();
        } catch (e) {
          console.error(e)
          
        }
    }

    async function reviewContent(content) {
        let approved = false;
        let reviewCount = 0;

        while(!approved && reviewCount < 5) {
            console.log("Reviewing Content invoked")
            const headers =  {}
            const params =  { prompt: 'Offer title is "'+content.title+'" and description is "'+content.description+'"', toneOfVoice: offerData.activeAudience.toneOfVoice ? offerData.activeAudience.toneOfVoice : 'neutral', action: 'review'}
            // set the authorization header and org from the ims props object
            if (props.ims.token && !headers.authorization) {
                headers.authorization = `Bearer ${props.ims.token}`
            }
            if (props.ims.org && !headers['x-gw-ims-org-id']) {
                headers['x-gw-ims-org-id'] = props.ims.org
            }

            try {
                const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
                console.log('Response received', actionResponse)
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
    }

    async function invokePromptCreatorAction () {
        console.log("Prompt Creation Action invoked")
        const headers =  {}
        let description = offerData.audiences[0].description
        const audience = getAudienceDetails();
        console.log("Found audience: ", audience)
        if(audience) {
            console.log("Description: ", audience.description)
            description = audience.description
        }
        const params =  { prompt: "generate keywords from this statement: " + description}
        // set the authorization header and org from the ims props object
        if (props.ims.token && !headers.authorization) {
            headers.authorization = `Bearer ${props.ims.token}`
        }
        if (props.ims.org && !headers['x-gw-ims-org-id']) {
            headers['x-gw-ims-org-id'] = props.ims.org
        }

        try {
          const actionResponse = await actionWebInvoke(actions["dx-excshell-1/generateCopy"], headers, params)
          console.log('Response received', actionResponse)
          return actionResponse;
        } catch (e) {
          console.error(e)
          
        }
    }

    async function invokePromptGeneratorAction () {
        setIsFireflyLoading(true);
        console.log("Prompt Generator Action invoked")
        console.log('Keywords: ', keywords)
        const audience = getAudienceDetails();
        const data = await invokePromptCreatorAction();
        setKeywords(data);
        console.log(data)
        console.log("Generate an image prompt for the following keywords: " + data.toString())

        const headers =  {}
        const params =  { 
            prompt: "Generate an image prompt for the following keywords: " + data.toString(), 
            isSystem: true, 
            systemPrompt: [
                "Generate an image prompt for an AI art bot. Create an image prompt that I can use with the Firefly AI art bot.", 
                "The images should always have a person as the main subject.", 
                "I will give you a sentence of what I have in mind, and then you generate the image prompts based on the following format: Firefly Prompt Format Style: [type of art], [subject or topic], [action or activity], [aesthetic details, lighting, and styles], [colors].", 
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
            console.log('Response received', actionResponse)
            let response = "";
            for (let x in actionResponse) {
                response += actionResponse[x] + ", ";
            }
            setIsFireflyLoading(false);
            return copy(response);
        } catch (e) {
          console.error(e)
          
        }
    }

    async function searchInAEM() {

    }

    function switchAudience(key) {
        console.log('Switching audience')
        
        const index = key.values().next().value-1;
        const audience = items[index];
        console.log('Audience: ', audience);

        const updatedItems = items.map(audience => audience.id === offerData.activeAudience.id ? offerData.activeAudience : audience)
        setItems(updatedItems)

        imagePromptRef.current.value = '';
        textPromptRef.current.value = '';

        setOfferData({ ...offerData, activeAudience: audience })

        const fetchData = async () => {
            const data = await invokePromptCreatorAction();
            setKeywords(data);
        }
        fetchData();
        audience.keywords = keywords;
        console.log("Offer Data: ", offerData);
    }

    function updateItems() {
        const updatedItems = items.map(audience => audience.id === offerData.activeAudience.id ? offerData.activeAudience : audience)
        setItems(updatedItems)
    }

    function setSelectedImage(image) {
        console.log("Image changed");
        offerData.activeAudience.selectedImage = image
        updateItems();
    }

    function setToneOfVoice(key) {
        offerData.activeAudience.toneOfVoice = key;
        updateItems();
    }

    function renderFireflyImages() {
        const images = (offerData.activeAudience && offerData.activeAudience.fireflyResponse) ? offerData.activeAudience.fireflyResponse : [];

       const imageList = images.map(image => 
            
            // <Radio key={image.id} id={image.id} value={image.image.base64} width="600px">
            //     <View height="size-800">
            //         <Image src={"data:image/png;base64," + image.image.base64}/>
            //     </View>
            // </Radio>
            <Radio key={image.id} id={image.id} value={image.image} width="600px">
                <View height="size-800">
                    <Image src={image.image}/>
                </View>
            </Radio>
        );

        return (
            <RadioGroup
                label="Generated Images"
                onChange={setSelectedImage} 
                orientation="horizontal"
                flex="1">

                {imageList}
            </RadioGroup>
        );
    }

    function renderFirefallResponse() {
        const response = (offerData.activeAudience && offerData.activeAudience.firefallReponse) ? offerData.activeAudience.firefallReponse : {title: 'Title', description: 'Description'};
        return <>
            <Well role="region" aria-labelledby="wellLabel">
                <h3 id="wellLabel">Title</h3>
                <p>{response.title}</p>
            </Well>
            <Well role="region" aria-labelledby="wellLabel">
                <h3 id="wellLabel">Description</h3>
                <p>{response.description}</p>
            </Well>
        </>
    }

    function overwriteFirefallCopy() {
        return <>
            <Well role="region" aria-labelledby="wellLabel">
                <h3 id="wellLabel">Title</h3>
                <p>{response.title}</p>
            </Well>
            <Well role="region" aria-labelledby="wellLabel">
                <h3 id="wellLabel">Description</h3>
                <p>{response.description}</p>
            </Well>
        </>
    }

    function getAudienceDetails() {
        if(offerData.activeAudience) {
            for (let index = 0; index < offerData.audiences.length; index++) {
                const element = offerData.audiences[index];
                if(element.name === offerData.activeAudience.name) {
                    return element
                }
            }
        }

        return {
            description: offerData.keymessage,
            id: 0,
            name: 'Default',
            origin: 'cloud'
        };
    }

    return(
        <Grid
          rows={['auto']}
          gap='size-100'
          minHeight='1000px'
          areas={[
            'sidebar content',
          ]}
          columns={['1fr', '3fr']}
        >
            <View gridArea='sidebar' padding-top='25px'>
                <ListView
                items={items}
                selectionMode="single"
                disallowEmptySelection
                aria-label="Static ListView items example"
                selectionStyle="highlight"
                defaultSelectedKeys={['1']}
                onSelectionChange={switchAudience}
                >
                    {(item) => <Item key={item.id}>{item.name}</Item>}
                </ListView>
                <Flex direction="row" marginTop="size-200">
                    <InlineAlert variant="info">
                        <Heading>Key audience information</Heading>
                        <Content>
                            {offerData.activeAudience &&  
                                getAudienceDetails().description}
                        </Content>
                    </InlineAlert>
                </Flex>
            </View>
            <View gridArea='content' borderWidth="thin"
                borderColor="dark"
                borderRadius="medium"
                padding="size-250">
                <Grid
                    rows={['auto']}
                    height='100vh'
                    gap='size-100'
                    areas={[
                        'audience',
                    ]}
                    columns={['3fr']}
                    >
                    <View gridArea='audience' >
                        <div className="wiz-body">
                            <TextArea
                                label="Image Generation Brief"
                                height="size-1250"
                                ref={imagePromptRef}
                                width="1200px"
                                name='promptArea'
                                onChange={(value) =>
                                setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, fireflyPrompt : value }})
                                }
                            />
                            <Flex direction="row" height="size-800" gap="size-100" marginTop="size-200">
                                <DialogTrigger type="fullscreen" isDismissable>
                                    <Button variant="secondary">Select AEM Assets</Button>
                                    {/* <AssetSelectorWrapper {...props} handleSelection={handleOnConfirm} /> */}
                                    <AssetSelector 
                                        discoveryURL="https://aem-discovery.adobe.io"
                                        apiKey="aem-assets-backend-nr-1"
                                        i18nSymbols = {i18nSymbol}
                                        imsOrg="28260E2056581D3B7F000101@AdobeOrg"
                                        imsToken={props.ims.token}
                                        handleAssetSelection={handleOnConfirm}
                                        handleSelection={handleOnConfirm} />
                                </DialogTrigger>
                                <Button variant="accent" onPress={() => {invokePromptGeneratorAction()}}>Create a prompt</Button>
                                <Button variant="accent" onPress={invokeFireflyAction}>Generate Images</Button>
                                <ProgressCircle
                                    aria-label="loading"
                                    isIndeterminate
                                    isHidden={!fireflyLoading}
                                    marginStart="size-100"
                                />
                            </Flex>
                            <Flex isHidden={!(offerData.activeAudience && offerData.activeAudience.fireflyResponse)} direction="row" height="size-5000" gap="size-100" >
                                {offerData.activeAudience &&  
                                    renderFireflyImages()
                                }
                            </Flex>
                            <TextArea
                                label="Copy Generation Brief"
                                height="size-1250"
                                width="1200px"
                                name='promptArea'
                                ref={textPromptRef}
                                onChange={(value) =>
                                setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, chatGPTPrompt : value }})
                                }
                            />
                            <Flex direction="row" height="size-800" gap="size-100" marginTop="size-200">
                                <Text>Tone of voice:</Text>
                                <ActionGroup flex label="Tone of voice:" selectionMode="single" defaultSelectedKeys={['neutral']} onSelectionChange={setToneOfVoice}>
                                    <Item key="neutral">Neutral</Item>
                                    <Item key="engaging">Engaging</Item>
                                    <Item key="analytical">Analytical</Item>
                                    <Item key="confident">Confident</Item>
                                </ActionGroup>
                            </Flex>
                            <Flex direction="row" height="size-800" gap="size-100" >
                                <Button variant="accent" onPress={invokeFirefallAction}>Generate Copy</Button>
                                <ProgressCircle
                                    aria-label="loading"
                                    isIndeterminate
                                    isHidden={!firefallLoading}
                                    marginStart="size-100"
                                />
                            </Flex>
                            <Flex isHidden={!(offerData.activeAudience && offerData.activeAudience.firefallReponse)} direction="row" width="1200px" gap="size-100" >
                                {offerData.activeAudience &&  
                                    renderFirefallResponse()
                                }
                            </Flex>
                        </div>
                    </View>
                </Grid>
            </View>
        </Grid>
    );
}
export default OfferWizard;