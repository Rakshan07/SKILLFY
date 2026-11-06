import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useWorkspaceAccount } from './account';
import { request, useResource, categoryName } from './api';
import { getRegistrationFields } from './registrationFields';
import { Heading, Panel, ResourceState } from './Workspace';

export function EventRegistration({ id }) {
  const navigate = useNavigate();
  const { account, activity, hasToken } = useWorkspaceAccount();
  const event = useResource(`/events/${encodeURIComponent(id)}`);
  const registration = useResource(`/events/${encodeURIComponent(id)}/registration`, Boolean(account.data));
  const [form, setForm] = useState({skills:'',role:'',experience_level:'intermediate',relevant_experience:'',availability_hours_per_week:10,contribution_intent:''});
  const [busy,setBusy] = useState(false), [error,setError] = useState('');
  const base = `/events/${encodeURIComponent(id)}`;
  const fields = getRegistrationFields(event.data || {});
  const roles = [...new Set([...(event.data?.roles || []).map(r => r.name).filter(name => name && name.toLowerCase() !== 'contributor'), ...fields.roles])];
  function update(e) { setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e) {
    e.preventDefault(); if(busy) return;
    const skills = [...new Set(form.skills.split(',').map(s=>s.trim()).filter(Boolean))];
    if (!skills.length || skills.length>30 || skills.some(s=>s.length>100)) {setError('Enter between 1 and 30 skills, up to 100 characters each.');return;}
    setBusy(true);setError('');
    try {
      await request(`${base}/register`,{method:'POST',body:JSON.stringify({selected_skills:skills.map(skill_name=>({skill_name,experience_level:form.experience_level})),preferred_roles:[form.role.trim()],experience_level:form.experience_level,relevant_experience:form.relevant_experience.trim()||null,availability_hours_per_week:Number(form.availability_hours_per_week),contribution_intent:form.contribution_intent.trim()||null})});
      activity.reload(); navigate(`${base}/assessment`,{replace:true});
    } catch(err) {setError(err.message);} finally {setBusy(false);}
  }
  if(!hasToken) return <Navigate to="/login" replace/>;
  if(account.data && !account.data.roles?.includes('participant') || account.data?.roles?.includes('organizer')) return <Panel title="Participant account required"><Link className="tw-button secondary" to={base}>Back to event</Link></Panel>;
  if(registration.data?.registered) return <Navigate to={`${base}/assessment`} replace/>;
  return <><Heading eyebrow="EVENT REGISTRATION" title={event.data?.title || 'Register for this event'} description={event.data ? categoryName(event.data) : ''}><Link className="tw-button secondary" to={base}>Back to event</Link></Heading>
    <ResourceState resource={event}><ResourceState resource={registration}>{event.data && (event.data.status !== 'open' ? <Panel title="Registration is closed"><Link to={base}>Back to event</Link></Panel> :
      <Panel title="Your skills & role"><form className="tw-formpanel tw-registration-form" onSubmit={submit}>
        <fieldset disabled={busy}>
          <label className="tw-field"><span>Skills for this event *</span><input name="skills" required value={form.skills} onChange={update}/><small>Separate skills with commas.</small></label>
          <div className="tw-registration-suggestions" aria-label="Suggested skills">{fields.skills.map(skill=><button type="button" className="tw-chip" key={skill} onClick={()=>setForm(f=>({...f,skills:[...new Set([...f.skills.split(',').map(s=>s.trim()).filter(Boolean),skill])].join(', ')}))}>+ {skill}</button>)}</div>
          <div className="tw-fieldpair"><label className="tw-field"><span>Preferred role *</span><input name="role" required maxLength={100} list="event-registration-roles" value={form.role} onChange={update}/><datalist id="event-registration-roles">{roles.map(role=><option key={role} value={role}/>)}</datalist><small>Choose a suggested role or enter your own.</small></label>
          <label className="tw-field"><span>Experience level *</span><select name="experience_level" value={form.experience_level} onChange={update}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div>
          <label className="tw-field"><span>{fields.experience} (optional)</span><textarea name="relevant_experience" maxLength={5000} rows={4} value={form.relevant_experience} onChange={update}/></label>
          <div className="tw-fieldpair"><label className="tw-field"><span>Availability (hours per week) *</span><input name="availability_hours_per_week" type="number" min={1} max={100} required value={form.availability_hours_per_week} onChange={update}/></label></div>
          <label className="tw-field"><span>What would you like to contribute? (optional)</span><textarea name="contribution_intent" maxLength={5000} rows={3} value={form.contribution_intent} onChange={update}/></label>
        </fieldset>
        {error && <p className="tw-notice" role="alert">{error}</p>}
        <div className="tw-formactions"><Link to={base}>Cancel</Link><button className="tw-button" disabled={busy}>{busy?'Registering…':'Continue to assessment'}</button></div>
      </form></Panel>)}</ResourceState></ResourceState></>;
}
