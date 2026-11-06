import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Users, Flag, Sparkles, UserRound, ClipboardCheck, ArrowRight, Mic, Cpu, Code2, Award, MessageSquare } from 'lucide-react';
import { Account } from './account';
import { useResource } from './api';
import { ResourceState } from './Workspace';

export default function Dashboard() {
  const {account,activity,hasToken}=useContext(Account);
  const profile=useResource('/profiles/me',hasToken);
  const summary=activity.data, p=profile.data;
  const name=(account.data?.full_name || account.data?.display_name || '').split(' ')[0];
  const latest=[...new Map([...(summary?.assessments || [])].reverse().map(a=>[a.event_id,a])).values()];
  const pending=latest.filter(a=>a.status!=='completed'), completed=latest.filter(a=>a.status==='completed');
  const totalXP=summary?.progress.total_xp;
  const next=summary?.next_level;
  const progress=next && totalXP!=null ? Math.min(100,Math.max(0,totalXP/next.minimum_xp*100)) : null;
  return <div className="tw-dashboard tw-personal-overview">
    <section className="tw-dashboard-welcome">
      <div><p className="tw-eyebrow">YOUR WORKSPACE / OVERVIEW</p><h1>{name?('Welcome back, '+name+'.'):'Your next chapter starts here.'}</h1><p>Bring your strengths. Find your people.<br/>Make your next contribution count.</p><Link className="tw-button" to="/profile">My dashboard <ArrowUpRight size={16}/></Link></div>
      <div className="tw-dashboard-art" aria-hidden="true"><span className="tw-dash-orbit"/><span className="tw-dash-orbit second"/><span className="tw-dash-icon central"><Users size={35}/></span><span className="tw-dash-icon coding"><Code2 size={24}/></span><span className="tw-dash-icon music"><Mic size={23}/></span><span className="tw-dash-icon robotics"><Cpu size={23}/></span><span className="tw-dash-art-caption">DIFFERENT STRENGTHS. SHARED AMBITION.</span></div>
    </section>
    <div className="tw-dashboard-stats">{[[Users,'Active teams',summary?.teams.length,'/my-team'],[ClipboardCheck,'Assessments completed',summary?completed.length:null,'/assessments'],[Award,'Reviewed contributions',summary?.contributions,'/profile'],[Sparkles,'Earned XP',totalXP,'/profile']].map(([Icon,label,value,path])=><Link to={path} key={label}><span className="tw-dash-stat-icon"><Icon size={19}/></span><div><strong>{value ?? '—'}</strong><span>{label}</span></div><ArrowUpRight size={15}/></Link>)}</div>
    <div className="tw-dashboard-columns">
      <div className="tw-personal-main">
        <section className="tw-personal-card"><div className="tw-dash-section-heading"><div><p className="tw-eyebrow">THE BIGGER PICTURE</p><h2>Your momentum</h2></div><Sparkles size={19}/></div><ResourceState resource={activity}><div className="tw-momentum-grid">{[[ClipboardCheck,'Show your strengths',completed.length,'Assessments completed','/assessments'],[Users,'Find your people',summary?.teams.length,'Teams you are part of','/my-team'],[Flag,'Make your mark',summary?.history.length,'Completed event participation','/profile']].map(([Icon,title,value,label,path])=><Link key={title} to={path}><span className="tw-momentum-icon"><Icon size={22}/></span><strong>{title}</strong><b>{value ?? '—'}</b><small>{label}</small><ArrowUpRight size={14}/></Link>)}</div></ResourceState></section>
        <section className="tw-personal-card"><div className="tw-dash-section-heading"><div><p className="tw-eyebrow">YOUR COLLABORATIONS</p><h2>People you build with</h2></div><Link to="/my-team">My teams <ArrowRight size={15}/></Link></div><ResourceState resource={activity}>{summary?.teams.length?<div className="tw-overview-team-links">{summary.teams.slice(0,2).map(team=><Link key={team.id} to={'/events/'+team.event_id+'/teams'}><span className="tw-overview-team-initial">{team.name.slice(0,1).toUpperCase()}</span><div><strong>{team.name.toUpperCase()}</strong><small>{team.role==='captain'?'Team leader':'Team member'}</small></div><MessageSquare size={18}/></Link>)}</div>:<div className="tw-overview-team-empty"><Users size={25}/><div><strong>Great collaboration begins with a connection.</strong><p>Your teams and conversations will be one click away here.</p></div><Link to="/my-team"><ArrowUpRight size={19}/><span className="sr-only">Open My Teams</span></Link></div>}</ResourceState></section>
        <section className="tw-personal-card tw-overview-profile"><div className="tw-dash-section-heading"><h2>Your identity, at a glance</h2><Link to="/profile">View profile <ArrowRight size={15}/></Link></div><ResourceState resource={profile}><div className="tw-overview-profile-row"><span className="tw-overview-profile-avatar"><UserRound size={25}/></span><div><strong>{account.data?.full_name || 'Your profile'}</strong><p>{[p?.institution,p?.course].filter(Boolean).join(' · ') || 'Your learning and collaboration journey'}</p></div></div>{p?.bio&&<p className="tw-overview-bio">{p.bio}</p>}{p?.skills?.length>0&&<div className="tw-overview-skill-tags">{p.skills.slice(0,6).map(skill=><span key={skill.skill_id}>{skill.skill_name}</span>)}</div>}</ResourceState></section>
      </div>
      <aside className="tw-dashboard-agenda tw-personal-side">
        <div className="tw-dash-section-heading"><h2>On your radar</h2><ClipboardCheck size={18}/></div>
        <ResourceState resource={activity}><Link className="tw-overview-next" to="/assessments"><span className="tw-overview-next-icon"><ClipboardCheck size={22}/></span><strong>{pending.length?(pending.length+' assessment'+(pending.length===1?'':'s')+' to finish'):'You are up to date'}</strong><p>{pending.length?'Pick up where you left off.':'Your next assessment will appear here when you begin.'}</p><span>{pending.length?'Continue assessments':'View assessments'} <ArrowRight size={14}/></span></Link></ResourceState>
        <section className="tw-overview-growth"><div><Sparkles size={17}/><span>YOUR GROWTH</span></div><strong>{totalXP ?? '—'} <small>XP</small></strong><p>{summary?.progress.level?'Level '+summary.progress.level:'Your progression'}</p>{progress!==null&&<><progress aria-label={'XP toward level '+next.level} max={next.minimum_xp} value={totalXP}/><small>{totalXP} / {next.minimum_xp} XP toward Level {next.level}</small></>}<Link to="/profile">See your progress <ArrowUpRight size={14}/></Link></section>
        <Link className="tw-dash-profile-link" to="/profile"><span><Award size={21}/></span><div><strong>Your contribution matters.</strong><p>{summary?.feedback.count?summary.feedback.count+' reviewed feedback entries':'Recognition grows with participation.'}</p></div><ArrowUpRight size={17}/></Link>
      </aside>
    </div>
  </div>;
}
