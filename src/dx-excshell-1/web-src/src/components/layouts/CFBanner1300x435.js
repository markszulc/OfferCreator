import React from 'react'
import SecurBankLogo from '../../resources/sb-logo.svg';
import SecurBankSquares from '../../resources/sb-squares.svg';


export default function CFBanner({ offerData, items, label}) {

  const selectImage = (name) => {
    if(offerData.activeAudience.isFromDam) {
      for (let index = 0; index < offerData.activeAudience.fireflyResponse[0].renditions; index++) {
        const rendition = offerData.activeAudience.fireflyResponse[0].renditions[index];
        if(rendition.crop === name) {
          return rendition.url
        }
      }
    }

    return offerData.activeAudience.selectedImage
  }

  return (
    <div>
    <div className='banner-1300x435-content' itemScope itemID={offerData.activeAudience.id} itemfilter="cf">
      <div className='banner-pic'>
        <div className='pic'>
          <img 
            loading="lazy" alt="" type="image/jpeg" 
            src={selectImage('Banner-1300x435')} 
            width="1600" height="634">
          </img>
        </div>
        <div className='logo'>
          <img itemProp="heroImage" itemType="image" src={SecurBankLogo} alt="Logo" />
        </div>
      </div>
      <div className='banner-text'>
      <h3>Sail into your financial future</h3>
        <h1 itemProp="headline" itemType="text">{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.title : ""}</h1>
        <p>{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.description : ""}</p>
        <p className='button-container'><a href='#' className='button primary'>See more</a></p>
      </div>
    </div>
    <h3 className='cfheading'>{label}</h3>
    </div>
  );

}