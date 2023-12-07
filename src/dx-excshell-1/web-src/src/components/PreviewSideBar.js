/* 
* <license header>
*/

import React, { useState } from 'react'
import { Header, ActionGroup, Text,Button, View, TagGroup, Item, Flex, ProgressBar, Switch } from '@adobe/react-spectrum'
import UploadToCloud from '@spectrum-icons/workflow/UploadToCloud';
import Draw from '@spectrum-icons/workflow/Draw';
import AlertCircle from '@spectrum-icons/workflow/AlertCircle';
import BeakerShare from '@spectrum-icons/workflow/BeakerShare';
import { actionWebInvoke } from '../utils';
import { invokeFireflyAction, invokeFirefallAction, invokePromptGeneratorAction, invokeRemixAudienceAction } from '../genai-utils'
import actions from '../config.json'

function PreviewSideBar ({offerData, items, setOfferData, setItems, props, setPage}) {
  const [aemUploading, setIsAEMUploading] = useState(false);
  const DEFAULT_LABEL = "Creating content and review tasks...";
  const [selected, updateSelection] = React.useState(false);
  const [label, setLabel] = useState(DEFAULT_LABEL)

  let showDetails = true;

  const updateVariation = (variation) => {
    setOfferData({ ...offerData, activeAudience: items[variation - 1]})
  }

  const remixAudiences = async () => {
    // setIsGenAILoading(true)
    setIsAEMUploading(true);
    setLabel("Re-mixing audiences...");
    const oldItems = items;
    const oldItemsLength = items.length;
    const newItems = [];
    for (let index = 0; index < oldItems.length; index++) {
      const item = oldItems[index];

      const audienceName = item.name;
      const audienceDesc = item.description;

      const remixResponse = await invokeRemixAudienceAction(audienceName, audienceDesc, props);
      if(Array.isArray(remixResponse)) {
        count = items.length + newItems.length + 1
        remixResponse = remixResponse.map((res) => ({id: count++, description: res.description, name: res.name, loadingState: true, isFromDam: false}));
        newItems.push(...remixResponse)
      }
    }

    const mergedItems = [...items, ...newItems];
    setItems(mergedItems);

    for (let index = oldItemsLength; index < mergedItems.length; index++) {
      const remixItem = mergedItems[index];
      const fireflyPrompt = await invokePromptGeneratorAction(remixItem.description, props)
      const fireflyImages = await invokeFireflyAction(fireflyPrompt, props)
      const firefallResponse = await invokeFirefallAction(remixItem.description, 'neutral', props)
      if(fireflyPrompt.error || fireflyImages.error || firefallResponse.error) {
        remixItem.error = true;
      }
      remixItem.selectedImage = !fireflyImages.error ? fireflyImages[0].image : "";
      remixItem.fireflyPrompt = fireflyPrompt;
      remixItem.firefallPrompt = remixItem.description;
      remixItem.firefallResponse = firefallResponse
      remixItem.fireflyResponse = !fireflyImages.error ? fireflyImages : []
      remixItem.loadingState = false;

      mergedItems[index] = remixItem;
      await sleep(1000);
    }

    setItems(mergedItems)
    setIsAEMUploading(false);
    setLabel(DEFAULT_LABEL);
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  const setSelection = () => {
    const newSelected = !selected;
    updateSelection(newSelected);

    if(!offerData.activeAudience.isFromDam) {
      if(newSelected) {
        setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, alternativeImage: newSelected, selectedImage: offerData.activeAudience.fireflyResponse[1].image }})
      } else {
        setOfferData({ ...offerData, activeAudience: {...offerData.activeAudience, alternativeImage: newSelected, selectedImage: offerData.activeAudience.fireflyResponse[0].image }})
      }
    }
  }

  const checkIfErrors = () => {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if(item.error) return true
    }

    return false;
  }

  async function invokeOfferCreatorAction () {
    setIsAEMUploading(true);
    const headers =  {}
    const cfData = [];
    
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
        headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = props.ims.org
    }

    const offerName = Math.floor(1000 + Math.random() * 9000);

    try {
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if(item.isFromDam) {
          const newItem = {
            firefallReponse: item.firefallResponse,
            imagePath: item.fireflyResponse[0].path,
            id: item.id,
            name: item.name,
            description: item.keywords ? item.keywords : item.description,
            isFromDam: true
          }
          cfData.push(newItem);
        } else {
          const params =  { name: item.name, selectedImage: item.selectedImage, prompt: item.fireflyPrompt, offerName: offerName}
          const actionResponse = await actionWebInvoke(actions["dx-excshell-1/createImage"], headers, params)
          const newItem = {
            firefallReponse: item.firefallResponse,
            imagePath: actionResponse,
            id: item.id,
            name: item.name,
            description: item.keywords ? item.keywords : item.description,
            isFromDam: false
          }
          cfData.push(newItem);
        }
      }

      const actionResponse = await actionWebInvoke(actions["dx-excshell-1/createOffer"], headers, {cfData: cfData, offerName: offerName})
      setIsAEMUploading(false);
      return actionResponse;
    } catch (e) {
      console.error(e)
    }
  }

  const layoutItems = [
    {id: 1, name: 'Web Banner 1920 x 390'},
    {id: 2, name: 'Web Banner 1300 x 435'},
    {id: 3, name: 'Web Banner 440 x 770'},
    {id: 4, name: 'Email Banner 1920 x 450'},
    {id: 5, name: 'App 150 x 150'},
    {id: 6, name: 'Digital Signage 1080 x 1920'}
  ];

  return (
    <View position='sticky' top='size-0' start='size-0' >
      <View isHidden={!showDetails}>
        <Header><strong>Segments</strong></Header>
        <ActionGroup selectionMode="single" defaultSelectedKeys={[''+items[0].id]} marginTop="10px" marginBottom="20px" onAction={updateVariation} >
          {items.map(function(item){
            if(item.error)
              return <Item className="error" key={item.id}><AlertCircle color="negative" /><Text>{item.name}</Text></Item>
            else if(item.loadingState)
              return <Item key={item.id}><BeakerShare/><Text>{item.name}</Text></Item>
            else
              return <Item key={item.id}><Text>{item.name}</Text></Item>;
          })}
        </ActionGroup>

        <Header><strong>Creative</strong></Header>
        <Switch onChange={setSelection} isSelected={offerData.activeAudience.alternativeImage ? offerData.activeAudience.alternativeImage : false}>Alternative creative</Switch>

        <Header><strong>Layouts</strong></Header>
        <TagGroup items={layoutItems} aria-label="Layouts TagGroup" marginBottom="20px">
            {item => <Item>{item.name}</Item>}
        </TagGroup>

        <Flex direction="row" height="size-800" gap="size-100" marginTop="size-200">
          <Button width="size-1400" aria-label="Upload NBC to AEM" marginTop="20px" marginEnd="10px" isDisabled={checkIfErrors()} onPress={() => invokeOfferCreatorAction()}><UploadToCloud width="size-200" /><Text>Submit</Text></Button>
          <Button width="size-1400" aria-label="Edit Offer" marginTop="20px" marginEnd="10px" onPress={() => setPage(3)}><Draw width="size-200" /><Text>Adjust</Text></Button>
          <Button width="size-1400" aria-label="Remix Audiences" marginTop="20px" marginEnd="10px" onPress={() => remixAudiences()}><BeakerShare width="size-200" /><Text>Re:Mix</Text></Button>
          
        </Flex>
        <Flex direction="row" height="size-800" gap="size-100" marginTop="size-200">
          <ProgressBar label={label} isIndeterminate isHidden={!aemUploading} />
        </Flex>
      </View>
    </View>
  )
}

export default PreviewSideBar
