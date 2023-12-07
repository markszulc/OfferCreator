import React, { useState }  from 'react'
import { Heading, View, Button, Content, Tooltip, TooltipTrigger, Link, Image, Flex, Text, Form, ProgressCircle, TextField, Switch, ActionButton, TableView, TableHeader, Column, TableBody, Row, Cell, StatusLight,
  Picker, Edit, Delete, IllustratedMessage} from '@adobe/react-spectrum'
import NotFound from '@spectrum-icons/illustrations/NotFound';
import {useAsyncList} from '@react-stately/data'
import PropTypes from 'prop-types'
import actions from '../config.json'
import {actionWebInvoke} from '../utils'

function AudienceList({ offerData, setOfferData , props }) {

  let columns = [
    { name: 'Audience Name', key: 'name' },
    { name: 'Description', key: 'description' },
    { name: 'Source', key: 'origin' }
  ];

//  let [exCloudAudiences, setexCloudAudiences] = useState(false);
  
  function renderEmptyState() {
    return (
      <IllustratedMessage>
        <NotFound />
        <Heading>No results</Heading>
        <Content>No results found</Content>
      </IllustratedMessage>
    );
  }

  let list = useAsyncList({

    async load({ signal}) {
      const headers = {}
      const params = {}

      // set the authorization header and org from the ims props object
      if (props.ims.token && !headers.authorization) {
        headers.authorization = `Bearer ${props.ims.token}`
      }
      if (props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = props.ims.org
      }

      let res = await actionWebInvoke(actions['getAudiences'], headers, params);
      
      let audienceresult = res.audiences
      
      if (offerData.exCloudAudiences === true) {
        audienceresult = res.audiences.filter((audience) => audience.origin == "cloud")
      }

      offerData.audiences = audienceresult

      return {
  
        items: audienceresult
      };
    }
  });


  return (
    <div className="other-info-container">
      <TableView
          renderEmptyState={renderEmptyState}
          selectionMode="multiple"
          selectedKeys={offerData.selectedAudience}
          onSelectionChange={(input) =>
            setOfferData({ ...offerData, selectedAudience : input })
          }
          >
        <TableHeader columns={columns}>
          {(column) => (
            <Column align={column.key !== 'name' ? 'end' : 'start'}>
              {column.name}
            </Column>
          )}
        </TableHeader>
        <TableBody
          items={list.items}
          loadingState={list.loadingState}
        
        >
          {(item) => (
            <Row key={item.name}>{(key) => <Cell>{item[key]}</Cell>}</Row>
          )}
        </TableBody> 
      </TableView>
      <TooltipTrigger>
        <Switch defaultSelected isReadOnly>Target</Switch>
        <Tooltip>Select from Audiences defined in Adobe Target (Default)</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
      <Switch 
        isSelected={offerData.excCloudAudiences}
        onChange={(input) =>
          setOfferData({ ...offerData, excCloudAudiences : input })
        }>
        Experience Cloud</Switch>
      <Tooltip>Select from Audiences defined in Adobe Experience Cloud (Not currently available)</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
      <Switch isReadOnly>Experience Platform</Switch>
      <Tooltip>Select from Audiences defined in Adobe Experience Platform / RT-CDP
        (Not currently available)</Tooltip>
      </TooltipTrigger>
    </div>
  );
}

AudienceList.propTypes = {
  runtime: PropTypes.any,
  ims: PropTypes.any, 
  state: PropTypes.any
}

export default AudienceList;