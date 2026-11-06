import { useEffect, useState } from 'react';
import { API_BASE } from './api';

export default function Avatar({userId,name='',className='',version=0}) {
  const [image,setImage]=useState('');
  useEffect(()=>{
    if(!userId)return;
    const controller=new AbortController();let url;
    setImage('');
    fetch(`${API_BASE}/profiles/${encodeURIComponent(userId)}/avatar`,{headers:{Authorization:`Bearer ${localStorage.getItem('teamweave_token') || ''}`},signal:controller.signal})
      .then(async response=>{if(!response.ok)return;const blob=await response.blob();if(controller.signal.aborted)return;url=URL.createObjectURL(blob);setImage(url);}).catch(()=>{});
    return()=>{controller.abort();if(url)URL.revokeObjectURL(url);};
  },[userId,version]);
  return <span className={`tw-avatar ${className}`}>{image?<img src={image} alt={`${name || 'Your'} profile picture`} onError={()=>setImage('')}/>:<span aria-hidden="true">{(name || '?').slice(0,1).toUpperCase()}</span>}</span>;
}
