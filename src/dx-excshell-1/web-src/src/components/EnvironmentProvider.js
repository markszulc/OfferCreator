/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import React, { useEffect, useState } from 'react';

import { registerAssetsSelectorsAuthService } from './AssetSelectorWrapper';

export const EnvironmentContext = React.createContext({});

const stageImsClientId = '31c794f8ab994967b74e5e02742ecf73';
const stageImsOrg = '928260E2056581D3B7F000101@AdobeOrg';

const prodImsClientId = '42591719a3db4669bc5b4a5275acf6d0';
const prodImsOrg = '28260E2056581D3B7F000101@AdobeOrg';

const initImsAuthInfo = {
  env: 'prod',
  imsClientId: prodImsClientId,
  imsScope:
    'AdobeID,openid,read_organizations,additional_info.projectedProductContext',
  redirectUrl: window.location.href,
  imsOrg: prodImsOrg,
  imsAuthService: undefined,
};

export const EnvironmentProvider = ({ children, ims }) => {
  const [environment, setEnvironment] = useState('prod');
  const [imsAuthInfo, setImsAuthInfo] = useState({
    env: 'prod',
    imsClientId: prodImsClientId,
    imsScope:
      'AdobeID,openid,read_organizations,additional_info.projectedProductContext',
    redirectUrl: window.location.href,
    imsOrg: ims.org,
    imsToken: ims.token,
  });

  const applyImsAuthChange = (props) => {
    // update the token service
    // you can also access the tokenService from window.assetsSelectorsAuthService
    setImsAuthInfo((prevInfo) => {
      return {
        ...prevInfo,
        ...props
      };
    });
  };

  const cancelImsAuthChange = () => {
    setImsAuthInfo({
      ...initImsAuthInfo,
    });
    setEnvironment('prod');
  };

  const signOut = () => {
    const tokenService =
      imsAuthInfo?.imsAuthService || window.assetsSelectorsAuthService;
    tokenService.signOut();
  };

  useEffect(() => {
    setImsAuthInfo((prevInfo) => {
      if (environment === 'stage') {
        return {
          ...prevInfo,
          env: 'stage',
          imsClientId: stageImsClientId,
          imsOrg: stageImsOrg,
        };
      }
      return initImsAuthInfo;
    });
  }, [environment]);

  return (
    <EnvironmentContext.Provider
      value={{
        environment,
        setEnvironment,
        imsAuthInfo,
        setImsAuthInfo,
        cancelImsAuthChange,
        applyImsAuthChange,
        signOut,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
};

export default EnvironmentProvider;