import React, { useState }  from 'react'
import {Link as RouterLink, useHistory} from 'react-router-dom';
import PropTypes from 'prop-types'
import { Heading, View, Button, Content, Link, Image, Flex, Text, Form, ProgressCircle, TextField, Switch, ActionButton, TableView, TableHeader, Column, TableBody, Row, Cell, StatusLight,
  Picker, Edit, Delete, TextArea} from '@adobe/react-spectrum'

const OfferDetails = (props) => {
  const history = useHistory();

  const [state, setState] = useState({
      offerTaskId: history.location? history.location.state.taskId : ''
  })

  return (
    <div className="offer-intent">

      <h3>{state.offerTaskId}</h3>
    </div>
  );
}

OfferDetails.propTypes = {
    runtime: PropTypes.any,
    ims: PropTypes.any
  }

export default OfferDetails;
