import React, { useState }  from 'react'
import { Heading, View, Button, Content, Link, Image, Flex, Text, Form, ProgressCircle, TextField, Switch, ActionButton, TableView, TableHeader, Column, TableBody, Row, Cell, StatusLight,
  Picker, Edit, Delete, TextArea} from '@adobe/react-spectrum'

function OfferIntent({ offerData, setOfferData  }) {
  return (
    <div className="offer-intent">

      <h3>Describe the key segment</h3>
      <TextArea 
        isRequired necessityIndicator="icon"
        value={offerData.keymessage}
        onChange={(input) =>
          setOfferData({ ...offerData, keymessage : input })
        }
        width="800px"
        maxWidth="100%"  />
    </div>
  );
}

export default OfferIntent;
