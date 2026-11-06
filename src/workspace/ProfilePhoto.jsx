import { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { request } from './api';
import Avatar from './Avatar';

export default function ProfilePhoto({userId,name,onChanged}) {
  const [version,setVersion]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function upload(e){
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Choose a PNG, JPEG or WebP image of 5 MB or smaller.');return;}
    setBusy(true);setError('');setNotice('');
    try{await request('/profiles/me/avatar',{method:'POST',headers:{'Content-Type':file.type},body:file});setVersion(v=>v+1);setNotice('Profile picture updated.');onChanged?.();}catch(err){setError(err.message);}finally{setBusy(false);}
  }
  async function remove(){setBusy(true);setError('');setNotice('');try{await request('/profiles/me/avatar',{method:'DELETE'});setVersion(v=>v+1);setNotice('Profile picture removed.');onChanged?.();}catch(err){setError(err.message);}finally{setBusy(false);}}
  return <div className="tw-photo-settings"><Avatar userId={userId} name={name} version={version} className="tw-profile-photo"/><div><label className={`tw-button secondary tw-photo-upload ${busy?'is-busy':''}`}><Camera size={15}/>{busy?'Saving…':'Upload photo'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={upload}/></label><button className="tw-textbutton" disabled={busy} type="button" onClick={remove}><Trash2 size={13}/>Remove</button><small>PNG, JPEG or WebP · up to 5 MB</small>{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}</div></div>;
}
