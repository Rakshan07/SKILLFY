import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useResource, request } from './api';

export default function Notifications({enabled}) {
  const resource=useResource('/notifications/me',enabled), navigate=useNavigate();
  const [open,setOpen]=useState(false), container=useRef(null);
  useEffect(()=>{if(!enabled)return;const timer=setInterval(resource.reload,15000);return()=>clearInterval(timer);},[enabled]);
  useEffect(()=>{if(!open)return;function close(e){if(e.type==='keydown'?e.key==='Escape':!container.current?.contains(e.target))setOpen(false);}document.addEventListener('pointerdown',close);document.addEventListener('keydown',close);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',close);};},[open]);
  const items=resource.data?.items || [], unread=items.filter(n=>!n.read_at).length;
  async function visit(item){try{await request(`/notifications/${item.id}/read`,{method:'POST'});resource.reload();setOpen(false);navigate(item.target_path);}catch{resource.reload();}}
  return <div className="tw-notifications" ref={container}><button className="tw-notification-toggle" aria-label={`Notifications${unread?`, ${unread} unread`:''}`} aria-expanded={open} onClick={()=>{setOpen(!open);resource.reload();}}><Bell size={18}/>{unread>0&&<span>{unread}</span>}</button>{open&&<section className="tw-notification-menu" aria-label="Team notifications"><h3>Mentions</h3>{resource.error?<p role="alert">{resource.error}</p>:resource.loading?<p>Loading…</p>:items.length?items.map(item=><button className={item.read_at?'':'unread'} key={item.id} onClick={()=>visit(item)}><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.created_at).toLocaleString()}</small></button>):<p>No mentions yet.</p>}</section>}</div>;
}
