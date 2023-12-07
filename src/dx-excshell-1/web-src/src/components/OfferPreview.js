import React, { useState, useEffect }  from 'react'
import { View, Grid, ProgressBar} from '@adobe/react-spectrum'
import PreviewSideBar from './PreviewSideBar'
import PreviewHome from './PreviewHome'
import { invokeFireflyAction, invokeFirefallAction, invokePromptGeneratorAction } from '../genai-utils'

function OfferPreview({ offerData, items, setOfferData, setItems, props, setPage }) {

  const [genAILoading, setIsGenAILoading] = useState(true);
  const [loading, setLoading] = useState(0);
  const [loadingText, setLoadingText] = useState('Generating Default Content');

  useEffect(() => {
    setIsGenAILoading(true)
    if(items.length > 0) {
      setIsGenAILoading(false)
    } else {
        let newItems = [];
        let index = 1;
        newItems.push({id: index, name: "Default", description: offerData.keymessage});
        index++
        if(offerData.selectedAudience) {
          for (var it = offerData.selectedAudience.values(), val= null; val=it.next().value; ) {
            console.log(val);
            const audienceDetails = getAudienceDetails(val);
            newItems.push({id: index, name: val, description: audienceDetails.description, loadingState: true});
            index++;
          }
        }

        const fetchData = async () => {
          const wipItems = []
          for (let index = 0; index < newItems.length; index++) {
            const item = newItems[index];
            
            setLoading(0);
            setLoadingText(item.name + ': Generating AI prompts');

            const fireflyPrompt = await invokePromptGeneratorAction(item.description, props)
            setLoading(25)
            setLoadingText(item.name + ': Generating images');
            
            const fireflyImages = await invokeFireflyAction(fireflyPrompt, props)
            setLoading(50)
            console.log('Firefly images ', fireflyImages)
            setLoadingText(item.name + ': Generating and reviewing copy');
            const firefallResponse = await invokeFirefallAction(item.description, 'neutral', props)
            setLoading(75)
            if(fireflyPrompt.error || fireflyImages.error || firefallResponse.error) {
              item.error = true;
            }
            item.selectedImage = !fireflyImages.error ? fireflyImages[0].image : "";
            item.fireflyPrompt = fireflyPrompt;
            item.firefallPrompt = item.description;
            item.firefallResponse = firefallResponse
            item.fireflyResponse = !fireflyImages.error ? fireflyImages : []
            item.loadingState = false;
            item.toneOfVoice = 'neutral';

            newItems[index] = item;
            wipItems[index] = item
            setItems(newItems)
            await sleep(1000);
            if(index === 0) {
              setOfferData({ ...offerData, activeAudience: newItems[0]})
            }
            setLoading(100)
            setIsGenAILoading(false)
          }
          setItems(newItems)
        }
        fetchData();
    }
  }, []);

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function getAudienceDetails(audienceName) {
    for (let index = 0; index < offerData.audiences.length; index++) {
        const element = offerData.audiences[index];
        if(element.name === audienceName) {
            return element
        }
    }

    return null;
  }

  function renderPreview() {
      return <Grid
        areas={['sidebar content']}
        columns={['350px', '3fr']}
        rows={['auto']}
        gap='size-100'
        isHidden={genAILoading}
      >
        <View 
            gridArea='sidebar'
            padding='size-200'>
            <PreviewSideBar offerData={offerData} items={items} setOfferData={setOfferData} setItems={setItems} props={props} setPage={setPage}></PreviewSideBar>
        </View>
        <View
          paddingTop='size-600'>
          <PreviewHome offerData={offerData} items={items} setOfferData={setOfferData} setItems={setItems}></PreviewHome>
        </View>
      </Grid>
  }

  return (
    <>
      {!genAILoading &&  
        renderPreview()
      }
      {genAILoading &&
        <div style={{height: "100%",  padding: 0, margin: 0, alignItems: 'center', justifyContent: 'center', display: 'flex'}}>
          <ProgressBar width="600px" label={loadingText} value={loading} />
        </div>
        
      }
    </>
  );
}

export default OfferPreview;
