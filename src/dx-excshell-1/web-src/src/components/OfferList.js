/* 
* <license header>
*/

import React, { useState }  from 'react'
import { Heading, View, Content, AlertDialog, DialogContainer, ProgressCircle, ContextualHelp, Link, Image, Text, TextArea, StatusLight, ActionButton, Button, ActionMenu, Edit, Card, Delete, Flex, TableView, TableHeader, Column, TableBody, Row, Cell, IllustratedMessage} from '@adobe/react-spectrum'
import NotFound from '@spectrum-icons/illustrations/NotFound';
import EditIcon from '@spectrum-icons/workflow/Edit';
import AddIcon from '@spectrum-icons/workflow/Add';
import {Link as RouterLink, useHistory} from 'react-router-dom';
import {useCollator} from 'react-aria';


import PropTypes from 'prop-types'
import {useAsyncList} from '@react-stately/data'

import actions from '../config.json'
import actionWebInvoke from '../utils'

const OfferList = (props) => {
  const [state, setState] = useState({
    actionResponseError: null,
    actionHeaders: null,
    actionParams: null,
    actionInvokeInProgress: false,
    actionResult: null,
    xfcreation: false
  })

  const history = useHistory();

  function renderEmptyState() {
    return (
      <IllustratedMessage>
        <NotFound />
        <Heading>No results</Heading>
        <Content>No results found</Content>
      </IllustratedMessage>
    );
  }

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openRoute = url => {
    history.push("/offercreator", {from:"homepage"});    
  };

  const refreshTable = url => {
    console.log("Refresh Table");  
    list.reload();  
  };


  let columns = [
    {name: 'Offer ID', uid: 'title', width: 100},
    {name: 'Description', uid: 'description', width: 400},
    {name: 'Modified by', uid: 'modifiedby', width: 200},
    {name: 'Status', uid: 'status', width: 120},
    {name: 'Content Fragment', uid: 'cfpath', width: 300}
  ];

  let [isOpen, setOpen] = React.useState(false);
  


    
   // invokes a the selected backend actions with input headers and params
  async function invokeXFCopyAction (offer, description) {
    console.log("Creating your XF for offer " + offer);

    const headers = state.actionHeaders || {}
    const params = state.actionParams || {}
          // set the authorization header and org from the ims props object
          if (props.ims.token && !headers.authorization) {
            headers.authorization = `Bearer ${props.ims.token}`
          }
          if (props.ims.org && !headers['x-gw-ims-org-id']) {
            headers['x-gw-ims-org-id'] = props.ims.org
          }
          
          params.xfname = offer;
          params.xfdescription = description;
           
          setState({ ...state, actionInvokeInProgress: true, actionResult: 'calling action ... ', xfcreation: true })
          let res = await actionWebInvoke(actions['copyXFandRename'], headers, params);
          setState({ ...state, actionInvokeInProgress: false, actionResult: ' ', xfcreation: false })
      
          console.log('copyXFandRename Action Result: ', res);
          alert("Experience Fragment Created!");
  }

  let collator = useCollator({ numeric: true });

  let list = useAsyncList({
    async load({signal}) {
      const headers = state.actionHeaders || {}
      const params = state.actionParams || {}

      // set the authorization header and org from the ims props object
      if (props.ims.token && !headers.authorization) {
        headers.authorization = `Bearer ${props.ims.token}`
      }
      if (props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = props.ims.org
      }
      
      
      setState({ ...state, actionInvokeInProgress: true, actionResult: 'calling action ... ' })
      let res = await actionWebInvoke(actions['getOffers'], headers, params);
      setState({ ...state, actionInvokeInProgress: false, actionResult: ' ' })
      
      console.log('Offers (Content Fragments) returned: ', res);

      return {
        items: res

      }
    },
    async sort({ items, sortDescriptor }) {
      return {
        items: items.sort((a, b) => {
          let first = a[sortDescriptor.column];
          let second = b[sortDescriptor.column];
          let cmp = collator.compare(first, second);
          if (sortDescriptor.direction === 'descending') {
            cmp *= -1;
          }
          return cmp;
        })
      };
    }
  });



  return (
    <View>
      <Heading level={1}>Offers</Heading>
      <Flex minHeight="size-3000" height="100%" width="100%" direction="column" gap="size-150">
      <TableView
          aria-label="A table that lists Offers"
          sortDescriptor={list.sortDescriptor}
          onSortChange={list.sort}
          renderEmptyState={renderEmptyState}
          flex
          density="spacious" 
          >
          <TableHeader columns={columns}>
            {column => (
              <Column
                key={column.uid}
                width={column.width}
                align={column.uid === 'date' ? 'end' : 'start'}
                allowsSorting>
                {column.name}
              </Column>
            )}
          </TableHeader>
          <TableBody
          items={list.items}
          loadingState={list.loadingState}
        
        >
          {(item) => (
            <Row key={item.title}>
              <Cell>
                {item.title}
              </Cell>
              <Cell>{item.description}</Cell>
              <Cell>{item.modifiedby}</Cell>
              <Cell>
                <StatusLight isHidden={!(item.published)} variant="positive"></StatusLight>
                <StatusLight isHidden={(item.published)} variant="info"></StatusLight>
              </Cell>
              <Cell><ActionButton width="size-1200"  aria-label="Edit Content Fragment" onPress={() => openInNewTab(item.cfedit)}><EditIcon width="size-400" marginStart="size-130" marginEnd="size-70" /><Text> Edit</Text></ActionButton>
                </Cell>
              {/* <Cell>
                <ActionButton isHidden={(item.xfcreated)} width="size-1000" aria-label="Create Experience Fragment" onPress={() => invokeXFCopyAction(item.title, item.description )}><AddIcon width="size-400" marginStart="size-100" marginEnd="size-80" /><Text>Create</Text></ActionButton>
                <ActionButton isHidden={(!item.xfcreated)} width="size-1000" aria-label="Edit Experience Fragment" onPress={() => openInNewTab(item.xfauthlink)}><EditIcon width="size-400" marginStart="size-130" marginEnd="size-70" /><Text>Edit</Text></ActionButton>
              </Cell> */}
            </Row>
          )}
        </TableBody> 
      </TableView>
      </Flex>
      <Button marginTop="size-100" onPress={() => openRoute()}><Text flex>Create Offer</Text></Button>
      <Button marginTop="size-100" marginStart="size-100" onPress={() => refreshTable()}><Text flex>Refresh List</Text></Button>
      <ProgressCircle
                    marginTop="size-100"
                    aria-label="loading"
                    isIndeterminate
                    isHidden={!state.xfcreation}
                    marginStart="size-100"
                  />
      {!state.actionResponseError && state.actionResponse && (
          <View padding={`size-100`} marginTop={`size-100`} marginBottom={`size-100`} borderRadius={`small `}>
            <StatusLight variant="positive">Experience Fragment created successfully!</StatusLight>
          </View>
        )}
      
      
    </View>
  )
}



OfferList.propTypes = {
  runtime: PropTypes.any,
  ims: PropTypes.any
}

export default OfferList