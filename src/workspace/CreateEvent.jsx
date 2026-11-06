import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heading, Panel } from './Workspace';
import { useWorkspaceAccount } from './account';
import { request, categories } from './api';

export function CreateEvent() {
 const { account, organizerAllowed } = useWorkspaceAccount();
 const navigate=useNavigate();
 const [form,setForm]=useState({title:'',category_id:'other',description:'',rules:'',prize_pool:'',start_date:'',end_date:'',registration_deadline:'',min_team_size:2,max_team_size:5});
 const [image,setImage]=useState(null),[preview,setPreview]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[savedId,setSavedId]=useState('');
 useEffect(()=>{if(!image){setPreview('');return;}const url=URL.createObjectURL(image);setPreview(url);return()=>URL.revokeObjectURL(url);},[image]);
 function update(e){setForm({...form,[e.target.name]:e.target.value});}
 async function publish(e){
  e.preventDefault();if(busy)return;setError('');
  if(image && (!['image/png','image/jpeg','image/webp'].includes(image.type)||image.size>5242880)){setError('Choose a PNG, JPEG or WebP image of 5 MB or smaller.');return;}
  const start=new Date(form.start_date),end=new Date(form.end_date),deadline=new Date(form.registration_deadline);
  if(!(deadline>new Date() && deadline<=start && start<end)){setError('Registration must close in the future, before the event starts and ends.');return;}
  if(Number(form.max_team_size)<Number(form.min_team_size)){setError('Maximum team size must be at least the minimum.');return;}
  setBusy(true);
  try{
   let id=savedId;
   if(!id){const result=await request('/events',{method:'POST',body:JSON.stringify({title:form.title.trim(),category_id:form.category_id,description:form.description.trim(),rules:form.rules.trim()||null,prize_pool:form.prize_pool.trim()||null,min_team_size:Number(form.min_team_size),max_team_size:Number(form.max_team_size),mode:'remote',start_date:start.toISOString(),end_date:end.toISOString(),registration_deadline:deadline.toISOString(),roles:[{name:'Contributor',suggested_count:Number(form.max_team_size)}]})});id=result.id;setSavedId(id);}
   if(image)await request(`/events/${id}/image`,{method:'POST',body:image,headers:{'Content-Type':image.type}});
   await request(`/events/${id}/publish`,{method:'POST'});
   navigate(`/events/${id}`);
  }catch(err){setError(err.message||'Your event could not be published. Please retry.');}finally{setBusy(false);}
 }
 if(account.loading)return <p role="status">Loading organizer account…</p>;
 if(!organizerAllowed||!account.data?.organizer_approved)return <Panel title="Organizer approval required"><p className="tw-formpanel">Complete organizer verification before publishing your first event.</p><Link className="tw-button" to="/organizer">Go to organizer workspace</Link></Panel>;
 return <><Heading eyebrow="CREATE EVENT" title="Bring your next event to life."/>
 <Panel title="Your event"><form className="tw-formpanel tw-event-create-form" onSubmit={publish}>
 <fieldset disabled={busy||Boolean(savedId)} style={{border:0,padding:0,margin:0,display:'grid',gap:18,minWidth:0}}>
 <div className="tw-fieldpair"><label className="tw-field"><span>Event name *</span><input name="title" required minLength={3} maxLength={200} value={form.title} onChange={update}/></label><label className="tw-field"><span>Category</span><select name="category_id" value={form.category_id} onChange={update}>{categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></div>
 <label className="tw-field"><span>About the event *</span><textarea name="description" required minLength={10} maxLength={20000} rows={7} value={form.description} onChange={update}/><small>Include the venue or online joining information.</small></label>
 <label className="tw-field"><span>Event rules</span><textarea name="rules" maxLength={10000} rows={4} value={form.rules} onChange={update}/></label>
 <label className="tw-field"><span>Prize pool</span><input name="prize_pool" maxLength={1000} value={form.prize_pool} onChange={update}/><small>Include the currency and prize breakdown.</small></label>
 <section><h3>Team size</h3><div className="tw-fieldpair">{[['min_team_size','Minimum members'],['max_team_size','Maximum members']].map(([name,label])=><label className="tw-field" key={name}><span>{label} *</span><input name={name} type="number" required min={1} max={100} step={1} value={form[name]} onChange={update}/></label>)}</div><p className="tw-subtle">For an exact team size, enter the same number in both fields.</p></section>
 <section><h3>Schedule</h3><div className="tw-fieldpair">{[['registration_deadline','Registration closes'],['start_date','Event starts'],['end_date','Event ends']].map(([name,label])=><label className="tw-field" key={name}><span>{label} *</span><input type="datetime-local" name={name} required value={form[name]} onChange={update}/></label>)}</div></section>
 </fieldset>
 <label className="tw-field"><span>Event image</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>setImage(e.target.files?.[0]||null)}/><small>PNG, JPEG or WebP · maximum 5 MB.</small></label>
 {preview&&<img className="tw-event-cover" src={preview} alt="Event image preview"/>}
 {error&&<p className="tw-notice" role="alert">{error}</p>}
 {savedId&&<p className="tw-subtle">Your event draft is saved. Retry publishing to finish.</p>}
 <div className="tw-formactions"><Link to="/organizer/events">Cancel</Link><button className="tw-button" disabled={busy}>{busy?'Publishing…':savedId?'Retry publishing':'Publish event'}</button></div>

 </form></Panel></>;
}
