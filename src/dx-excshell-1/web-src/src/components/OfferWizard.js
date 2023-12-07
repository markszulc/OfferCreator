import { ActionGroup, Button, Content, DialogTrigger, Flex, Grid, Heading, Image, InlineAlert, Item, ListView, ProgressCircle, Radio, RadioGroup, Text, TextArea, View, Well} from "@adobe/react-spectrum";
import { useState, useRef } from "react";
import actions from '../config.json'
import { actionWebInvoke } from "../utils";

import copy from 'copy-to-clipboard';
import { AssetSelector } from '@quarry-connected/asset-selector';

function OfferWizard({ offerData, items, setOfferData, setItems, props }) {

    const DM_URL = 'https://s7ap1.scene7.com/is/image/ZoranNikolovskiAPAC003/';
    const REPO_ID = 'author-p115476-e1135027.adobeaemcloud.com';
    const IMS_ORG = '28260E2056581D3B7F000101@AdobeOrg';

    const [keywords, setKeywords] = useState([]);
    const [fireflyLoading, setIsFireflyLoading] = useState(false);
    const [firefallLoading, setIsFirefallLoading] = useState(false);

    const imagePromptRef = useRef(null);
    const textPromptRef = useRef(null);

    const i18nSymbol = {
        dialogTitle: 'Search for Offer Assets',
        confirmLabel: 'Confirm selection',
        cancelLabel: 'Cancel',
    };

    const handleOnConfirm = async (assets) => {
        const imageUrl = 'https://'+assets[0].computedMetadata['repo:repositoryId']+assets[0].computedMetadata['repo:path']
        const renditions = []
        renditions.push({crop: 'Banner-1920x390', url: DM_URL+assets[0].name.replace(/\.[^/.]+$/, "")+':Banner-1920x390'});
        renditions.push({crop: 'Banner-440x770', url: DM_URL+assets[0].name.replace(/\.[^/.]+$/, "")+':Banner-440x770'});
        renditions.push({crop: 'Banner-1300x435', url: DM_URL+assets[0].name.replace(/\.[^/.]+$/, "")+':Banner-1300x435'});
        renditions.push({crop: 'Signage-1080x1920', url: DM_URL+assets[0].name.replace(/\.[^/.]+$/, "")+':Signage-1080x1920'});
        setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, selectedImage: imageUrl, error: false, isFromDam: true, fireflyResponse: [{id: 0, image: imageUrl, name: assets[0].name, path: assets[0].computedMetadata['repo:path'], renditions: renditions}]}})
    };

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
          const fireflyResponse = actionResponse.map((image) => ({id: actionResponse.indexOf(image), image: image.imageUrl, name: image.name}));
          setIsFireflyLoading(false);
          const activeAudience = offerData.activeAudience;
          activeAudience.fireflyResponse = fireflyResponse;
          activeAudience.isFromDam = false;
          activeAudience.error = false
          setOfferData({ ...offerData, activeAudience: activeAudience})
          updateItems();
        } catch (e) {
          console.error(e)
          
        }
    }

    async function invokeFirefallAction () {
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
          const reviewedContent = await reviewContent(actionResponse)
          setIsFirefallLoading(false)
          setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, error: false, firefallResponse: reviewedContent }})
          updateItems();
        } catch (e) {
          console.error(e)
        }
    }

    async function reviewContent(content) {
        let approved = false;
        let reviewCount = 0;

        while(!approved && reviewCount < 5) {
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
        const headers =  {}
        let description = offerData.audiences[0].description
        const audience = getAudienceDetails();
        if(audience) {
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
          return actionResponse;
        } catch (e) {
          console.error(e)
        }
    }

    async function invokePromptGeneratorAction () {
        setIsFireflyLoading(true);
        const data = await invokePromptCreatorAction();
        setKeywords(data);

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

    function switchAudience(key) {
        const index = key.values().next().value-1;
        const audience = items[index];

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
    }

    function updateItems() {
        const updatedItems = items.map(audience => audience.id === offerData.activeAudience.id ? offerData.activeAudience : audience)
        setItems(updatedItems)
    }

    function setSelectedImage(image) {
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
                value={offerData.activeAudience.selectedImage}
                flex="1">
                {imageList}
            </RadioGroup>
        );
    }

    function renderFirefallResponse() {
        const response = (offerData.activeAudience && offerData.activeAudience.firefallResponse) ? offerData.activeAudience.firefallResponse : {title: 'Title', description: 'Description'};
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
                    selectedKeys={new Set([''+offerData.activeAudience.id])}
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
                                defaultValue={offerData.activeAudience.fireflyPrompt}
                                value={offerData.activeAudience.fireflyPrompt}
                                onChange={(value) =>
                                setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, fireflyPrompt : value }})
                                }
                            />
                            <Flex direction="row" height="size-800" gap="size-100" marginTop="size-200">
                                <DialogTrigger type="fullscreen" isDismissable>
                                    <Button variant="secondary">Select AEM Assets</Button>
                                    <AssetSelector 
                                        discoveryURL="https://aem-discovery.adobe.io"
                                        apiKey="aem-assets-backend-nr-1"
                                        i18nSymbols = {i18nSymbol}
                                        imsOrg={IMS_ORG}
                                        imsToken={props.ims.token}
                                        handleSelection={handleOnConfirm}
                                        repositoryId={REPO_ID} />
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
                                defaultValue={offerData.activeAudience.firefallPrompt}
                                value={offerData.activeAudience.firefallPrompt}
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
                            <Flex isHidden={!(offerData.activeAudience && offerData.activeAudience.firefallResponse)} direction="row" width="1200px" gap="size-100" >
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