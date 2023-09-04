import React, { useState }  from 'react'
import { Heading, View, Button, Text, ActionButton, Well, ProgressCircle, StatusLight } from '@adobe/react-spectrum'
import OfferIntent from "./OfferIntent";
import AudienceList from "./AudienceList";
import OfferPreview from "./OfferPreview";
import actions from '../config.json';
import actionWebInvoke from '../utils';
import {Link as RouterLink, useHistory} from 'react-router-dom';


const OfferCreator = (props) => {
  const [page, setPage] = useState(0);
  const history = useHistory();

  const [offerData, setOfferData] = useState({
    keymessage: "",
    selectedAudience: null,
    excCloudAudiences: true,
    offerCopy: "",
    offerTitle: "",
    offerDescription: "",
    offerID: ""
  });

  const [state, setState] = useState({
    actionResponseError: null,
    actionHeaders: null,
    actionParams: null,
    cfTitle: null,
    cfHeading: null,
    offerProduct: null,
    actionParamsValid: null,
    actionInvokeInProgress: false,
    actionResult: null
  });
  
  const FormTitles = ["Create a new Offer", "Who is the target audience?", "Is this what you want created?"];
  const PageDisplay = () => {
    if (page === 0) {
      return <OfferIntent offerData={offerData} setOfferData={setOfferData} />;
    } else if (page === 1) {
      return <AudienceList offerData={offerData} setOfferData={setOfferData} props={props} />;
    } else {
      return <OfferPreview offerData={offerData} setOfferData={setOfferData} props={props} />;
    } 
  };

  const openRoute = url => {
    history.push("/", {from:"offercreator"});    
  };

  async function invokeAction () {
    console.log("Create Offer invoked")
    setState({ ...state, actionInvokeInProgress: true, actionResult: 'calling action ... ' })
    const headers = state.actionHeaders || {}
    const params = state.actionParams || {}
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
      headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = props.ims.org
    }

    var val = Math.floor(1000 + Math.random() * 9000);
    console.log("Offer #" + val);
    params.name = val.toString();
    params.offers = offerData.offers;
    // params.title = offerData.offerTitle;
    // params.description = offerData.offerDescription;
    params.brief = offerData.keymessage;
    params.audiences = offerData.selectedAudience;


    try {
      const actionResponse = await actionWebInvoke(actions["dx-excshell-1/createOffer"], headers, params)
      formattedResult = JSON.stringify(actionResponse,0,2)
      setState({
        ...state,
        actionResponse,
        actionResult:formattedResult,
        actionResponseError: null,
        actionInvokeInProgress: false
      })
      console.log(`Response :`, actionResponse);
    } catch (e) {
      console.error(e)
      
    }
  }


  return (
    <View width='100%'>
      <div className="wiz-header">
          <h1>{FormTitles[page]}</h1>
      </div>
      <div className="wiz-body">{PageDisplay()}</div>
      <div className="wiz-footer">
          {!state.actionResponseError && !state.actionResponse && (
          <ActionButton
            isHidden={page == 0}
            onPress={() => {
              setPage((currPage) => currPage - 1);
            }}
          >
              Prev
          </ActionButton>
          )}
          {!state.actionResponseError && !state.actionResponse && (
          
          <ActionButton
            onPress={() => {
              if (page === FormTitles.length - 1) {
                console.log("call action");
                invokeAction(this);
              } else {
                setPage((currPage) => currPage + 1);
              }
            }}
          >
            {page === FormTitles.length - 1 ? "Create Offer" : "Next"}
          </ActionButton>
          )}
          <ActionButton onPress={() => openRoute()}><Text flex>Cancel</Text></ActionButton>
          <ProgressCircle
                    aria-label="loading"
                    isIndeterminate
                    isHidden={!state.actionInvokeInProgress}
                    marginStart="size-100"
                  />
        </div>
        {state.actionResponseError && (
        <View padding={`size-100`} marginTop={`size-100`} marginBottom={`size-100`} borderRadius={`small `}>
          <StatusLight variant="negative">Failure! See the complete error in your browser console.</StatusLight>
          <Button marginTop="size-100" onPress={() => openRoute()}><Text flex>Offer List</Text></Button>
        </View>
        )}
        {!state.actionResponseError && state.actionResponse && (
          <View padding={`size-100`} marginTop={`size-100`} marginBottom={`size-100`} borderRadius={`small `}>
            <StatusLight variant="positive">Content Fragment { offerData.offerID } created successfully!</StatusLight>
            <Button marginTop="size-100" onPress={() => openRoute()}><Text flex>Offer List</Text></Button>
          </View>
        )}
        <div className="wizardsummary">
          <Well>
            <p><strong>Offer Description: </strong>{offerData.keymessage}</p>
            <p><strong>Selected Audiences: </strong>{offerData.selectedAudience}</p>
            <p><strong>Offer Copy: </strong>{offerData.offerCopy}</p>
          </Well>
        </div>
    </View>
  )
}


export default OfferCreator