import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Users, ClipboardCheck, CheckCircle, Clock, Search, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { Account } from './account';
import { categoryName, eventDate } from './api';
import { ResourceState } from './Workspace';

function HubHeader({teams,total,completed,loading}) {
  return <section className="tw-hub-header"><div><p className="tw-eyebrow">{teams?'YOUR COLLABORATIONS':'YOUR SKILLS IN ACTION'}</p><h1>{teams?'Great things start with your people.':'Make your strengths stand out.'}</h1><p>{teams?'Your teams, shared goals and conversations, together.':'Continue an assessment or see what your answers revealed.'}</p></div><div className="tw-hub-summary"><span><strong>{loading?'—':total}</strong>{teams?'Teams':'Assessments'}</span><span><strong>{loading?'—':completed}</strong>{teams?'Led by you':'Completed'}</span><span className="tw-hub-summary-symbol" aria-hidden="true">{teams?<Users size={34}/>:<ClipboardCheck size={34}/>}</span></div></section>;
}

function HubToolbar({search,setSearch,tabs,active,setActive,label}) {
  return <div className="tw-hub-toolbar"><div role="group" aria-label={label} className="tw-hub-filters">{tabs.map(tab=><button key={tab} aria-pressed={active===tab} className={active===tab?'active':''} onClick={()=>setActive(tab)}>{tab}</button>)}</div><label className="tw-hub-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={label} aria-label={label}/></label></div>;
}

function HubEmpty({teams,filtered}) {
  return <div className="tw-hub-empty"><div className="tw-hub-empty-art">{teams?<Users size={34}/>:<ClipboardCheck size={34}/>}<Sparkles size={19}/></div><h2>{filtered?'No matches here.':teams?'Your team story starts here.':'Give your skills a voice.'}</h2><p>{filtered?'Try another search or filter.':teams?'Join an event, complete its assessment, then find people with complementary strengths.':'Join an event to unlock questions matched to its category and your role.'}</p>{!filtered&&<Link className="tw-button" to="/events">Find an event <ArrowRight size={16}/></Link>}</div>;
}

export function TeamsHub() {
  const {activity}=useContext(Account), teams=activity.data?.teams || [];
  const [search,setSearch]=useState(''),[active,setActive]=useState('All teams');
  const items=teams.filter(t=>(active!=='Leading'||t.role==='captain')&&(active!=='Member'||t.role!=='captain')&&`${t.name} ${t.event_title} ${t.assigned_role || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="tw-activity-hub"><HubHeader teams total={teams.length} completed={teams.filter(t=>t.role==='captain').length} loading={activity.loading}/><HubToolbar search={search} setSearch={setSearch} tabs={['All teams','Leading','Member']} active={active} setActive={setActive} label="Search teams"/>
    <ResourceState resource={activity}>{items.length?<div className="tw-team-hub-grid">{items.map(team=><article className="tw-team-hub-card" key={team.id}><div className={`tw-team-hub-cover ${team.image_url?'has-image':''}`}>{team.image_url&&<img src={team.image_url} alt="" loading="lazy"/>}<span className="tw-hub-category">{categoryName(team)}</span><span className="tw-team-hub-monogram">{team.name.slice(0,2).toUpperCase()}</span></div><div className="tw-team-hub-content"><div className="tw-hub-card-top"><span className="tw-hub-status">{team.status?.replaceAll('_',' ') || 'Team'}</span><span className="tw-hub-membership">{team.role==='captain'?'Leader':'Member'}</span></div><h2>{team.name.toUpperCase()}</h2><Link className="tw-hub-event-link" to={`/events/${team.event_id}`}>{team.event_title}<ArrowUpRight size={13}/></Link><p className="tw-hub-assigned-role">Your role <strong>{team.assigned_role || (team.role==='captain'?'Leader':'Member')}</strong></p><div className="tw-team-hub-people"><div className="tw-hub-avatars">{(team.members_preview || []).map((member,index)=><span key={index} title={member.display_name}>{member.display_name.slice(0,1).toUpperCase()}</span>)}</div><span>{team.member_count ?? '—'} / {team.max_team_size ?? '—'} members</span></div><Link className="tw-button tw-hub-open" to={`/events/${team.event_id}/teams`}><MessageSquare size={16}/>Open team room<ArrowUpRight size={16}/></Link></div></article>)}</div>:<HubEmpty teams filtered={Boolean(teams.length)}/>}</ResourceState>
  </div>;
}

const statusLabels={completed:'Completed',ready:'Ready to answer',draft:'In progress',generating:'Preparing questions',submitted:'Submitted',evaluating:'Being evaluated',failed:'Needs attention'};
export function AssessmentHub() {
  const {activity}=useContext(Account);
  const assessments=[...new Map([...(activity.data?.assessments || [])].reverse().map(a=>[a.event_id,a])).values()];
  const [search,setSearch]=useState(''),[active,setActive]=useState('All assessments');
  const items=assessments.filter(a=>(active!=='Completed'||a.status==='completed')&&(active!=='To finish'||a.status!=='completed')&&`${a.event_title || a.title} ${categoryName(a)}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="tw-activity-hub"><HubHeader total={assessments.length} completed={assessments.filter(a=>a.status==='completed').length} loading={activity.loading}/><HubToolbar search={search} setSearch={setSearch} tabs={['All assessments','To finish','Completed']} active={active} setActive={setActive} label="Search assessments"/>
    <ResourceState resource={activity}>{items.length?<div className="tw-assessment-hub-list">{items.map(a=><article className="tw-assessment-hub-card" key={a.id}><div className="tw-assessment-hub-cover">{a.image_url?<img src={a.image_url} alt="" loading="lazy"/>:<ClipboardCheck size={32}/>}</div><div className="tw-assessment-hub-content"><div className="tw-hub-card-top"><span className="tw-hub-category-text">{categoryName(a)}</span><span className={`tw-hub-status ${a.status==='completed'?'completed':a.status==='failed'?'attention':''}`}>{a.status==='completed'?<CheckCircle size={12}/>:<Clock size={12}/>} {statusLabels[a.status] || a.status}</span></div><h2>{a.event_title || a.title || 'Event assessment'}</h2><p>{a.status==='completed'?'Your evaluation and role recommendations are ready.':a.status==='failed'?'Open your assessment to review the issue and retry.':'Questions tailored to your skills and this event.'}</p>{a.submitted_at&&<small>Submitted {eventDate(a.submitted_at)}</small>}</div><div className="tw-assessment-hub-action">{a.status==='completed'&&a.evaluation_score!=null&&<div className="tw-hub-result"><strong>{Number(a.evaluation_score).toFixed(0)}<span>/100</span></strong><small>Assessment estimate</small></div>}<Link className={`tw-button ${a.status==='completed'?'secondary':''}`} to={`/events/${a.event_id}/assessment`}>{a.status==='completed'?'View results':a.status==='failed'?'Review & retry':'Continue'}<ArrowUpRight size={16}/></Link></div></article>)}</div>:<HubEmpty filtered={Boolean(assessments.length)}/>}</ResourceState>
  </div>;
}
