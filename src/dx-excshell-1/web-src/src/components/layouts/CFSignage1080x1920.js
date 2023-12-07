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
    <div className='signage-1080x1920-content'>
      <div className='signage-pic'>
      <img 
          loading="lazy" alt="" type="image/jpeg" 
          src={selectImage('Signage-1080x1920')}  
          width="1600" height="634"></img>
      </div>
      <div className='signage-text'>
        <h3>Sail into your financial future</h3>
        <h1>{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.title : ""}</h1>
        <p>{offerData.activeAudience.firefallResponse ? offerData.activeAudience.firefallResponse.description : ""}</p>
      </div>
    </div>
    <h3 className='cfheading'>{label}</h3>
    </div>
  );

}