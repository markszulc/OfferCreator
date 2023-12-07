/* 
* <license header>
*/

import 'core-js/stable'
import 'regenerator-runtime/runtime'

window.React = require('react')
import * as ReactDOM from "react-dom/client";

import Runtime, { init } from '@adobe/exc-app'

import App from './components/App'
import './index.css'
import './styles/index.css'
import './styles/CFBanner.css'
import './styles/CFSignage.css'
import './styles/CFApp.css'

/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
try {
  // attempt to load the Experience Cloud Runtime
  require('./exc-runtime')
  // if there are no errors, bootstrap the app in the Experience Cloud Shell
  init(bootstrapInExcShell)
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  // fallback mode, run the application without the Experience Cloud Runtime
  bootstrapRaw()
}

function bootstrapRaw () {
  /* **here you can mock the exc runtime and ims objects** */
  const mockRuntime = { on: () => {} }
  const mockIms = {}

  // render the actual react application and pass along the runtime object to make it available to the App
  const rootElement = document.getElementById("root");
  let root = ReactDOM.createRoot(rootElement);
  root.render(<App runtime={mockRuntime} ims={mockIms} />);
}

function bootstrapInExcShell () {
  // get the Experience Cloud Runtime object
  const runtime = Runtime()

  // use this to set a favicon
  // runtime.favicon = 'url-to-favicon'

  // use this to respond to clicks on the app-bar title
  // runtime.heroClick = () => window.alert('Did I ever tell you you\'re my hero?')

  // ready event brings in authentication/user info
  runtime.on('ready', ({ imsOrg, imsToken, imsProfile, locale }) => {
    // tell the exc-runtime object we are done
    runtime.done()
    console.log('Ready! received imsProfile:', imsProfile)
    const ims = {
      profile: imsProfile,
      org: imsOrg,
      token: imsToken
    }
    // render the actual react application and pass along the runtime and ims objects to make it available to the App
    const rootElement = document.getElementById("root");
    let root = ReactDOM.createRoot(rootElement);
    root.render(<App runtime={runtime} ims={ims} />);
  })

  // set solution info, shortTitle is used when window is too small to display full title
  runtime.solution = {
    icon: 'AdobeExperienceCloud',
    title: 'Offer Creator',
    shortTitle: 'JGR'
  }
  runtime.title = 'Offer Creator'
}
