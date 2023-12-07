import React from 'react'


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
    <div className='banner-1920x390-content'>
      <div className='banner-pic'>
      <img 
          loading="lazy" alt="" type="image/jpeg" 
          src={selectImage('Banner-1920x390')}  
          width="1920" height="390"></img>
      </div>
      <div className='banner-text'>
        <h3>Sail into your financial future</h3>
        <h1>{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.title : ""}</h1>
        <p>{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.description : ""}</p>
        <p className='button-container'><a href='#' className='button primary'>See more</a></p>
      </div>
    </div>
    <h3 className='cfheading'>{label}</h3>
    </div>
  );

}