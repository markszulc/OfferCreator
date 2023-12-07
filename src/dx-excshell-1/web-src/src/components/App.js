/* 
* <license header>
*/

import React from 'react'
import { Provider, defaultTheme, Grid, View, TableView, TableHeader, Column, TableBody, Row, Cell } from '@adobe/react-spectrum'
import ErrorBoundary from 'react-error-boundary'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import SideBar from './SideBar'
import ActionsForm from './ActionsForm'
import BannerCreator from './BannerCreator'
import OfferCreator from './OfferCreator'
import OfferList from './OfferList'
import OfferDetails from './OfferDetails'
import OfferListSimple from './OfferListSimple'
import { ToastContainer } from '@react-spectrum/toast'
import EnvironmentProvider from './EnvironmentProvider'

function App (props) {
  console.log('runtime object:', props.runtime)
  console.log('ims object:', props.ims)

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', ({ imsOrg, imsToken, locale }) => {
    console.log('configuration change', { imsOrg, imsToken, locale })
  })
  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  return (
    <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
    <Router>
      <Provider theme={defaultTheme} colorScheme={`light`}>
        <EnvironmentProvider ims={props.ims}>
          <ToastContainer/>
          <Grid
            areas={['sidebar content']}
            columns={['0px', '3fr']}
            rows={['auto']}
            height='100vh'
            gap='size-100'
          >
    
            <View gridArea='content' padding='size-200'>
              <Switch>
                <Route exact path='/'>
                  <OfferList runtime={props.runtime} ims={props.ims}></OfferList>
                </Route>
                <Route path='/actions'>
                  <ActionsForm runtime={props.runtime} ims={props.ims} />
                </Route>
                <Route path='/bannercreator'>
                  <BannerCreator runtime={props.runtime} ims={props.ims}></BannerCreator>
                </Route>
                <Route path='/offercreator'>
                  <OfferCreator runtime={props.runtime} ims={props.ims}></OfferCreator>
                </Route>
                <Route path='/offerdetails'>
                  <OfferDetails runtime={props.runtime} ims={props.ims} props={props}></OfferDetails>
                </Route>
              </Switch>
            </View>
          </Grid>
        </EnvironmentProvider>
      </Provider>
    </Router>
  </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
  function onError (e, componentStack) { }

  // component to show if UI fails rendering
  function fallbackComponent ({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>
          Something went wrong :(
        </h1>
        <pre>{componentStack + '\n' + error.message}</pre>
      </React.Fragment>
    )
  }
}

export default App
