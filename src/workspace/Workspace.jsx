import Avatar from './Avatar';
import ProfilePhoto from './ProfilePhoto';
import { TeamsHub, AssessmentHub } from './ActivityHubs';
import Dashboard from './Dashboard';
import PrizePool from './PrizePool';
import Notifications from './Notifications';
import { EventRegistration } from './EventRegistration';
import ThemeToggle from '../components/ui/ThemeToggle';
import Documents from './Documents';
import { useContext, useState, useEffect } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowRight, CalendarDays, Users, UserRound, LayoutDashboard, 
  ClipboardCheck, Compass, Plus, Menu, X, LogOut, Flag, Code2, Cpu, Mic, 
  ShieldCheck, Search, Award, CheckCircle, Sparkles, AlertCircle, MessageSquare 
} from 'lucide-react';
import { useApp } from '../app/AppContext';
import { BrandWordmark } from '../components/ui/BrandMark';
import { useResource, categories, request, categoryName, eventDate } from './api';
import { CreateEvent } from './CreateEvent';
import { Assessment } from './Assessment';
import { TeamManagement } from './TeamManagement';
import './workspace.css';
import { Account } from './account';

export function Action({ to, children, secondary = false }) { 
  return <Link className={`tw-button ${secondary ? 'secondary' : ''}`} to={to}>{children}<ArrowUpRight size={16}/></Link>; 
}
export function Heading({ eyebrow, title, description, children }) { 
  return <div className="tw-heading"><div><p className="tw-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}</div>; 
}
export function Panel({ title, description, action, children }) { 
  return <section className="tw-panel"><div className="tw-panelhead"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>; 
}
export function Empty({ icon: Icon = Compass, title, description, children }) { 
  return <div className="tw-empty"><div className="tw-empty-symbol"><Icon size={24}/></div><h3>{title}</h3><p>{description}</p>{children}</div>; 
}
export function ResourceState({ resource, children }) { 
  if (resource.loading) return <div className="tw-empty" role="status">Loading…</div>; 
  if (resource.error) return <div className="tw-empty" role="alert"><p>{resource.error}</p><button className="tw-button secondary" onClick={resource.reload}>Try again</button></div>; 
  return children; 
}
function Metrics({ items }) { 
  return <div className="tw-metrics">{items.map(([label,value,description,Icon]) => <div className="tw-metric" key={label}><div><Icon size={16}/>{label}</div><strong>{value ?? '—'}</strong><small>{description}</small></div>)}</div>; 
}

const participantNav = [
  ['/dashboard','Overview',LayoutDashboard],
  ['/events','Explore events',Compass],
  ['/my-events','My events',CalendarDays],
  ['/assessments','Assessments',ClipboardCheck],
  ['/my-team','My teams',Users],
  ['/profile','My Profile',UserRound]
];
const organizerNav = [
  ['/organizer','Overview',LayoutDashboard],
  ['/organizer/events','My events',CalendarDays],
  ['/organizer/create','Create event',Plus],
  ['/organizer/roster','Participants',Users],
  ['/organizer/teams','Team formation',Users],
  ['/organizer/results','Results & contributions',Flag]
];

export function WorkspaceShell() {
  const { state, dispatch } = useApp();
  const location = useLocation(); 
  const navigate = useNavigate();

  const hasToken = Boolean(localStorage.getItem('teamweave_token'));
  const account = useResource('/auth/me', hasToken);
  // Shared event URLs retain the signed-in account's organizer workspace.
  const organizer = account.data?.roles?.includes('organizer') || location.pathname.startsWith('/organizer');
  const nav = organizer ? organizerNav : participantNav;
  const roles = account.data?.roles || [];
  const organizerAllowed = roles.includes('organizer') || roles.includes('admin');
  const activity = useResource('/workspace/me', hasToken && !organizer);
  const context = { account, hasToken, organizerAllowed, activity };

  async function logout() { 
    try { await request('/auth/logout', {method:'POST'}); } catch { /* offline */ } 
    finally { localStorage.removeItem('teamweave_token'); dispatch({type:'LOGOUT'}); navigate('/'); } 
  }

  if (hasToken && account.loading && !account.data) return <div className="tw-empty" role="status">Loading your workspace…</div>;

  if (account.data && !account.data.onboarding_complete) return <Navigate to="/complete-profile" replace/>;

  const pageTitle = nav.find(([path]) => path === location.pathname)?.[1] || 
    (location.pathname.endsWith('/assessment') ? 'Assessment' : 
     location.pathname.endsWith('/teams') ? 'Teams & Chat' : location.pathname.endsWith('/register') ? 'Registration' : 'Event details');

  return (
    <Account.Provider value={context}>
      <div id="tw-workspace-review">
        <div className="tw-app">
          <aside className="tw-sidebar">
            <Link to="/" className="tw-brand" aria-label="Skillfy home"><BrandWordmark size={20}/></Link>
            <p className="tw-navlabel">{organizer ? 'ORGANIZER WORKSPACE' : 'YOUR WORKSPACE'}</p>
            <nav className="tw-nav" aria-label="Workspace">
              {nav.map(([path,label,Icon]) => (
                <NavLink end key={path} to={path}>
                  <Icon size={17}/>{label}
                </NavLink>
              ))}
            </nav>
            <div className="tw-sideend">
              {roles.includes('admin') && <Link to="/admin/organizer-review">Review organizer applications</Link>}
              <p className="tw-sidequote">Different strengths.<br/><em>Shared ambition.</em></p>
              <div className="tw-sideidentity">
                <UserRound/>
                <div>{account.data?.full_name || account.data?.display_name || 'Your account'}<small>{organizer ? 'Organizer workspace' : 'Participant workspace'}</small></div>
              </div>
              {hasToken && <button className="tw-textbutton" onClick={logout}><LogOut size={14}/>Sign out</button>}
            </div>
          </aside>

          <div className="tw-main">
            <header className="tw-topbar">
              <div className="tw-breadcrumb">Workspace <span>/</span><strong>{pageTitle}</strong></div>
              <div className="tw-topmeta"><ShieldCheck size={15}/>{organizer ? 'Organizer' : 'Participant'}<Notifications enabled={hasToken}/><ThemeToggle /></div>
            </header>
            <main className="tw-content">

              {organizer && !account.data?.organizer_approved && (
                <div className="tw-notice">Organizer verification is required before hosting events. <Link to="/complete-profile">View application / submit documents</Link></div>
              )}
              {!hasToken && (
                <div className="tw-notice">
                  <p>Sign in to load your personal events, profile, and team activity.</p>
                  <Action to={organizer ? '/organizer/auth' : '/login'}>Sign in</Action>
                </div>
              )}
              {hasToken && account.error && (
                <div className="tw-notice" role="alert">
                  <p>{account.error}</p><button className="tw-button secondary" onClick={account.reload}>Retry</button>
                </div>
              )}
              <WorkspacePage path={location.pathname} organizer={organizer} state={state}/>
              {location.pathname === "/profile" && <details className="tw-optional-documents"><summary>Documents & certificates <span>Optional</span></summary><Documents/></details>}
              <footer className="tw-bottomline">
                <span>Skillfy · Made for collaboration.</span>
                <span>Different strengths. Shared ambition.</span>
              </footer>
            </main>
          </div>
        </div>
      </div>
    </Account.Provider>
  );
}

function WorkspacePage({ path, organizer, state }) {
  if (path === '/profile') return <Profile/>;
  if (path === '/events') return <Events/>;
  if (path.startsWith('/events/') && path.endsWith('/register')) return <EventRegistration key={path.split('/')[2]} id={path.split('/')[2]}/>;
  if (path.startsWith('/events/') && path.endsWith('/assessment')) {
    return <Assessment eventId={path.split('/')[2]}/>;
  }
  if (path.startsWith('/events/') && path.endsWith('/teams')) {
    return <TeamManagement eventId={path.split('/')[2]}/>;
  }
  if (path.startsWith('/events/')) return <EventDetail id={path.split('/')[2]}/>;
  if (path === '/organizer/create') return <CreateEvent/>;
  if (path === '/organizer' || path === '/organizer/events') return <Organizer manage={path.endsWith('/events')}/>;
  if (path === '/dashboard') return <Home/>;
  if (path === '/my-team') return <MyTeamsHub/>;
  if (path === '/assessments') return <AssessmentsHub/>;

  const title = path === '/my-events' ? 'From joining to making an impact.' : organizer ? 'Make room for meaningful contributions.' : 'Your next chapter starts here.';
  return (
    <>
      <Heading eyebrow={organizer ? 'ORGANIZER WORKSPACE' : 'YOUR JOURNEY'} title={title} description="Your events, people, and progress in one place."/>
      <Panel title={path === '/organizer/results' ? 'Results & contributions' : 'Your activity'}>
        <ActivityList path={path} organizer={organizer}/>
        <div className="tw-empty">
          <Action to={organizer ? '/organizer/events' : '/events'} secondary>{organizer ? 'View my events' : 'Explore events'}</Action>
        </div>
      </Panel>
    </>
  );
}

function ActivityList({path,organizer}) {
 const {activity,account}=useContext(Account); 
 const org=useResource('/organizer/workspace',Boolean(organizer&&account.data));
 if(path==='/my-events') return <ActivityTabs/>;
 const resource=organizer?org:activity;
 const key=organizer?(path.endsWith('roster')?'participants':path.endsWith('results')?'outcomes':'teams'):'teams';
 const items=resource.data?.[key]||[];
 return (
   <ResourceState resource={resource}>
     {items.length ? (
       <div className="tw-event-list">
         {items.map((item,i) => (
           <article className="tw-event-card" key={item.id||`${item.event_id}-${item.user_id}-${i}`}>
             <h3>{item.name||item.title||item.display_name}</h3>
             <p>{item.event_title}</p>
             <span className="tw-badge">{item.status}</span>
             {item.outcome_type && <p>{item.outcome_type}</p>}
           </article>
         ))}
       </div>
     ) : (
       <Empty icon={Users} title={resource.data?'Nothing here yet.':'Sign in to view your activity.'}/>
     )}
   </ResourceState>
 );
}

function Home() { return <Dashboard/>; }

function ActivityTabs() {
  const [tab,setTab]=useState('Upcoming'); 
  const {activity,hasToken}=useContext(Account); 
  const [now]=useState(()=>Date.now());
  const items=(activity.data?.registrations||[]).filter(e => 
    tab==='Completed' ? e.status==='completed' : 
    e.status!=='cancelled' && e.status!=='completed' && 
    (tab==='Upcoming' ? new Date(e.starts_at).getTime()>now : new Date(e.starts_at).getTime()<=now && new Date(e.ends_at).getTime()>now)
  );
  return (
    <>
      <div className="tw-rowtabs" role="group" aria-label="Event status">
        {['Upcoming','In progress','Completed'].map(t => (
          <button key={t} className={t===tab?'active':''} aria-pressed={t===tab} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>
      <ResourceState resource={activity}>
        {items.length ? (
          <EventCards items={items} actionLabel="View event"/>
        ) : (
          <Empty icon={CalendarDays} title={hasToken?`No ${tab.toLowerCase()} events yet.`:'Sign in to view your events.'}/>
        )}
      </ResourceState>
    </>
  );
}

export function EventCards({ items, organizer = false, actionLabel }) {
  return <div className="tw-event-list tw-event-gallery">{items.map(event => {
    const status = event.status === 'published' ? (new Date(event.registration_opens_at)>new Date()?'Opens soon':'Registration closed') : ({open:'Registration open',completed:'Concluded',draft:'Draft',cancelled:'Cancelled'}[event.status] || event.status);
    const label=categoryName(event);
    return <Link to={`/events/${event.id}`} className="tw-gallery-card" key={event.id} aria-label={`${organizer?'Manage':'Explore'} ${event.title}`}>
      <div className={`tw-gallery-poster ${event.image_url?'':'without-image'}`}>
        {event.image_url ? <><img className="tw-poster-backdrop" src={event.image_url} alt="" aria-hidden="true" loading="lazy"/><img className="tw-poster-image" src={event.image_url} alt={`${event.title} event poster`} loading="lazy"/></> : <div className="tw-poster-placeholder"><span>SKILLFY / EVENTS</span><Sparkles size={44}/><strong>{label}</strong></div>}
        <span className="tw-gallery-category">{label}</span>
        <span className="tw-gallery-date"><CalendarDays size={12}/>{eventDate(event.start_date || event.starts_at)}</span>
        <span className="tw-gallery-arrow" aria-hidden="true"><ArrowUpRight size={19}/></span>
      </div>
      <div className="tw-gallery-body">
        <div className={`tw-gallery-status ${event.status==='open'?'is-open':''}`}><i/>{status}</div>
        <h3>{event.title}</h3>
        <p className="tw-gallery-description">{event.description}</p>
        <div className="tw-gallery-facts"><span><Users size={13}/>{event.min_team_size}–{event.max_team_size} members</span><span>{event.mode==='remote'?'Online':event.mode==='in-person'?'In person':'Hybrid'}</span></div>
        <PrizePool value={event.prize_pool} compact/>
        <footer><span className="tw-gallery-organizer" title={event.organizer_name}>{event.organizer_name || 'Event organizer'}</span><span className="tw-gallery-cta">{actionLabel || (organizer?'Manage event':'Explore event')} <ArrowRight size={14}/></span></footer>
      </div>
    </Link>;
  })}</div>;
}

function Events() {
  const location = useLocation(); 
  const [query,setQuery] = useState(''); 
  const [category,setCategory] = useState(new URLSearchParams(location.search).get('category') || 'all'); 
  const [page,setPage] = useState(1);
  const params = new URLSearchParams({ status:'open',page:String(page),limit:'12' }); 
  if(query) params.set('search',query); 
  if(category!=='all') params.set('category',category);
  const events = useResource(`/events?${params}`);

  return (
    <>
      <Heading eyebrow="DISCOVER YOUR NEXT CHALLENGE" title="A place for your skills." description="Explore published events. Find a challenge that fits your interests and experience."/>
      <div className="tw-toolbar">
        <label className="tw-search">
          <Search size={17}/>
          <input aria-label="Search events" placeholder="Search events or interests" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/>
        </label>
        <select className="tw-select" aria-label="Event category" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>
          <option value="all">All categories</option>
          {categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <Panel title="Open for registration" action={events.data && <span className="tw-badge">{events.data.total} events</span>}>
        <ResourceState resource={events}>
          {events.data?.items?.length ? (
            <EventCards items={events.data.items}/>
          ) : (
            <Empty icon={CalendarDays} title="The next opportunity starts here." description="No published events match these filters. Check back as organizers open new opportunities."/>
          )}
        </ResourceState>
      </Panel>
      <div className="tw-formactions">
        <button className="tw-button secondary" disabled={page===1 || events.loading} onClick={()=>setPage(page-1)}>Previous</button>
        <span>Page {page}</span>
        <button className="tw-button secondary" disabled={!events.data?.has_more || events.loading} onClick={()=>setPage(page+1)}>Next</button>
      </div>
    </>
  );
}

// ─── Enhanced Event Detail with Event-Specific Intake & Navigation ───────────

function EventDetail({ id }) {
  const event = useResource(`/events/${encodeURIComponent(id)}`);
  const { account, activity } = useContext(Account);
  const regCheck = useResource(`/events/${encodeURIComponent(id)}/registration`, Boolean(account.data));
  const assessmentCheck = useResource(`/events/${encodeURIComponent(id)}/assessment`, Boolean(account.data));
  const [statusMsg, setStatusMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegistered = regCheck.data?.registered;
  const canParticipate = account.data?.roles?.includes('participant') && !account.data?.roles?.includes('organizer');
  const isOwner = event.data?.organizer_id === account.data?.id;
  const isDraft = event.data?.status === 'draft';
  const assessmentStatus = assessmentCheck.data?.status;

  async function handlePublish() {
    setBusy(true);
    setStatusMsg('');
    try {
      await request(`/events/${encodeURIComponent(id)}/publish`, { method: 'POST' });
      event.reload();
      setStatusMsg('Event published successfully.');
    } catch (error) {
      setStatusMsg(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading 
        eyebrow="EVENT OVERVIEW" 
        title={event.data?.title || 'Event details'} 
        description={event.data ? categoryName(event.data) : 'Explore the brief, team requirements, and schedule.'}
      />

      <ResourceState resource={event}>
        {event.data && (
          <div style={{ display: 'grid', gap: 20 }}>
            {statusMsg && <div className="tw-notice" role="status">{statusMsg}</div>}

            <Panel title="The Challenge & Brief">
              <div className={`tw-event-detail-layout ${event.data.image_url ? "has-poster" : ""}`}>
              {event.data.image_url && <div className="tw-event-detail-poster"><img src={event.data.image_url} alt={event.data.title}/></div>}
              <div className="tw-event-detail-information">
              <PrizePool value={event.data.prize_pool}/>
              <article className="tw-event-card tw-event-detail-brief">
                {/* Actions Footer */}
                <footer>
                  <span style={{ fontSize: 12, color: 'var(--sf-muted)' }}>
                    Status: <strong style={{ textTransform: 'capitalize' }}>{event.data.status}</strong>
                  </span>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {isOwner && isDraft && (
                      <button className="tw-button" disabled={busy || !account.data?.organizer_approved} onClick={handlePublish}>
                        Publish event
                      </button>
                    )}

                    {canParticipate && !isRegistered && event.data.status === 'open' && (
                      <Link className="tw-button" to={`/events/${encodeURIComponent(id)}/register`}>
                        Register / Participate <ArrowRight size={16}/>
                      </Link>
                    )}

                    {canParticipate && isRegistered && (
                      <>
                        <span className="tw-badge" style={{ background: '#E2F2E4', color: '#22552B', border: '1px solid #C4E2C7' }}>
                          <CheckCircle size={13} style={{ marginRight: 4 }} /> Registered
                        </span>
                        <Link className="tw-button" to={`/events/${encodeURIComponent(id)}/assessment`}>
                          <ClipboardCheck size={15} />
                          {assessmentStatus === 'completed' ? 'View Assessment' : 'Take Assessment'}
                        </Link>
                        <Link className="tw-button secondary" to={`/events/${encodeURIComponent(id)}/teams`}>
                          <Users size={15} /> Team Formation & Chat
                        </Link>
                      </>
                    )}
                  </div>
                </footer>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{event.data.description}</p>

                {/* Event Schedule & Capacity */}
                <div className="tw-checklist" style={{ marginBottom: 20 }}>
                  <div><CalendarDays/><h3>Event date</h3><p>{eventDate(event.data.start_date)}</p></div>
                  <div><Users/><h3>Team size</h3><p>{event.data.min_team_size}–{event.data.max_team_size} participants</p></div>
                  <div><Flag/><h3>Registration closes</h3><p>{eventDate(event.data.registration_deadline)}</p></div>
                </div>

                {/* Additional Brief Details */}
                <dl className="tw-details" style={{ padding: 0, marginBottom: 20 }}>
                  {event.data.expected_deliverables && (
                    <div><dt>Expected Deliverables</dt><dd>{event.data.expected_deliverables}</dd></div>
                  )}
                  {event.data.rules && (
                    <div><dt>Rules & Eligibility</dt><dd>{event.data.rules}</dd></div>
                  )}
                  {event.data.constraints_and_tools && (
                    <div><dt>Permitted Tools & Constraints</dt><dd>{event.data.constraints_and_tools}</dd></div>
                  )}
                  {event.data.judging_criteria && (
                    <div><dt>Judging Criteria</dt><dd>{event.data.judging_criteria}</dd></div>
                  )}
                </dl>

                {/* Skills & Roles */}
                {event.data.requirements?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ fontSize: 12, color: 'var(--sf-muted)', display: 'block', marginBottom: 8 }}>Required & Suggested Skills:</strong>
                    <div className="tw-categories" style={{ padding: 0 }}>
                      {event.data.requirements.map(r => (
                        <span className="tw-chip" key={r.id || r.skill_name}>{r.skill_name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {event.data.roles?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <strong style={{ fontSize: 12, color: 'var(--sf-muted)', display: 'block', marginBottom: 8 }}>Complementary Roles:</strong>
                    <div className="tw-categories" style={{ padding: 0 }}>
                      {event.data.roles.map(r => (
                        <span className="tw-chip" key={r.id || r.name}>{r.name}</span>
                      ))}
                    </div>
                  </div>
                )}


              </article>
              </div></div>
            </Panel>

          </div>
        )}
      </ResourceState>
    </>
  );
}

// ─── My Teams Hub View ───────────────────────────────────────────────────────

function MyTeamsHub() { return <TeamsHub/>; }

function AssessmentsHub() { return <AssessmentHub/>; }

function Profile() {
  const { account,hasToken,activity } = useContext(Account); 
  const summary=activity.data; 
  const profile = useResource('/profiles/me',hasToken); 
  const xp = useResource('/challenges/xp/me',hasToken); 
  const [editing,setEditing] = useState(false); 
  const [bio,setBio] = useState(''); 
  const [detailsForm,setDetailsForm]=useState({}); 
  const [message,setMessage] = useState(''); 
  const [busy,setBusy] = useState(false);
  const p=profile.data || {}; 
  const u=account.data || {};

  async function save(e){
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await request('/profiles/me',{
        method:'PATCH',
        body:JSON.stringify({
          ...detailsForm,
          bio,
          academic_year:detailsForm.academic_year?Number(detailsForm.academic_year):null,
          country_code:detailsForm.country_code||null
        })
      });
      setEditing(false);
      profile.reload();
      account.reload();
      setMessage('Profile updated.');
    } catch(error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const details=[
    ['Full name',u.full_name || u.display_name],
    ['Email',u.email],
    ['Phone number',p.phone_number],
    ['Address',p.address],
    ['College / institution',p.institution],
    ['Course',p.course],
    ['Academic year (YYYY)',p.academic_year],
    ['Skills',p.skills?.map(s=>s.skill_name||s.name).join(', ')]
  ];

  return (
    <div className="tw-profile-page">
      <Heading eyebrow="MY PROFILE" title="Your story, still being written." description="Your details, contributions, and everything you build along the way.">
        <button className="tw-button secondary" disabled={!profile.data} onClick={()=>{setBio(p.bio || '');setDetailsForm(Object.fromEntries(['full_name','institution','course','academic_year','phone_number','address_line_1','city','region','postal_code','country_code'].map(k=>[k,p[k]??''])));setEditing(!editing);}}>Edit profile</button>
      </Heading>
      <Panel title="Primary details" action={<span className="tw-badge">Private details</span>}>
        <ResourceState resource={profile}>
          <div className="tw-profile-identity">
            <Avatar userId={u.id} name={u.full_name || u.display_name} className="tw-profile-photo" version={p.photo_revision || 0}/>
            <div><h2>{u.full_name || u.display_name || 'Your profile'}</h2><p>{p.bio || 'Make space for what makes you, you.'}</p></div>
          </div>
          <dl className="tw-details">
            {details.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value || 'Not available'}</dd></div>)}
          </dl>
        </ResourceState>
        {editing && (
          <form className="tw-formpanel tw-profile-edit" onSubmit={save}>
            <ProfilePhoto userId={u.id} name={u.full_name || u.display_name} onChanged={profile.reload}/>
            <label className="tw-field"><span>About you</span><textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={4000}/></label>
            <div className="tw-fieldpair">
              {[['full_name','Full name'],['institution','College'],['course','Course'],['academic_year','Academic year (YYYY)'],['phone_number','Phone'],['address_line_1','Address'],['city','City'],['region','State / region'],['postal_code','Postal code'],['country_code','Country code (e.g. IN)']].map(([key,label]) => (
                <label className="tw-field" key={key}>
                  <span>{label}</span>
                  <input 
                    type={key==='academic_year'?'number':'text'} 
                    min={key==='academic_year'?1900:undefined} 
                    max={key==='academic_year'?2200:undefined} 
                    maxLength={key==='country_code'?2:undefined} 
                    value={detailsForm[key]} 
                    onChange={e=>setDetailsForm({...detailsForm,[key]:key==='country_code'?e.target.value.toUpperCase():e.target.value})}
                  />
                </label>
              ))}
            </div>
            <div className="tw-formactions">
              <button type="button" className="tw-button secondary" onClick={()=>setEditing(false)}>Cancel</button>
              <button className="tw-button" disabled={busy}>{busy?'Saving…':'Save profile'}</button>
            </div>
          </form>
        )}
        {message && <div className="tw-notice" role="status">{message}</div>}
      </Panel>
      <section className="tw-panel tw-profile-growth">
        <div className="tw-profile-growth-top">
          <div>
            <p className="tw-eyebrow">YOUR EXPERIENCE</p>
            <h2>Every contribution moves you forward.</h2>
            <p>Grow through completed events, individual performance, and reviewed feedback.</p>
          </div>
          <div className="tw-profile-balance">
            <strong>{xp.data?.total_xp ?? '—'} <small>XP</small></strong>
            <span>{xp.data ? 'Earned so far' : 'Experience unavailable'}</span>
          </div>
        </div>
        <div className="tw-levels">
          <span>{summary?.progress.level ? `Level ${summary.progress.level}` : "Level not configured"}</span>
          <span>{summary?.next_level ? `Level ${summary.next_level.level} at ${summary.next_level.minimum_xp} XP` : "Next level not configured"}</span>
        </div>
        <p className="tw-subtle">Your level comes from verified XP and the platform’s progression rules.</p>
      </section>
      <Panel title="Your contribution matters" description="Recognition goes beyond the final result.">
        <Metrics items={[
          ["Completed events",summary?.history.length,'Verified participation',Flag],
          ["Team contributions",summary?.contributions,'Recorded contributions',Users],
          ["Reviewed feedback",summary?.feedback.count,'Verified feedback',Award]
        ]}/>
      </Panel>
      <Panel title="Completed event history" description="Your role, contribution, result, and earned XP for each event.">
        <div className="tw-table-wrap">
          <table className="tw-table">
            <thead>
              <tr>{['Event / date','Your role','Contribution','Outcome','XP earned'].map(t=><th key={t}>{t}</th>)}</tr>
            </thead>
            <tbody>
              {summary?.history.length ? summary.history.map(e=>(
                <tr key={e.event_id}>
                  <td>{e.title}<br/>{eventDate(e.ends_at)}</td>
                  <td>{e.role_description||'—'}</td>
                  <td>{e.contribution_summary||'—'}</td>
                  <td>{e.outcomes.join(', ')}</td>
                  <td>{e.xp_earned}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="tw-table-empty">{summary?'No completed events yet.':'Sign in or reconnect to load your history.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="tw-empty"><Action to="/events" secondary>Explore events</Action></div>
      </Panel>
      <details className="tw-profile-xp-rules">
        <summary>How participation, feedback, and wins contribute to XP</summary>
        <div className="tw-checklist">
          {[
            ['Participation','Eligible, completed events build your experience.'],
            ['Contribution','Reviewed individual performance matters even when your team does not win.'],
            ['Winning','Verified wins can earn additional rewards under platform rules.']
          ].map(([title,text])=>(
            <div key={title}><h3>{title}</h3><p>{text}</p></div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Organizer({ manage }) {
  const { account,organizerAllowed } = useContext(Account); 
  const overview=useResource('/organizer/workspace',Boolean(account.data&&organizerAllowed)); 
  const [page,setPage] = useState(1); 
  const [tab,setTab] = useState('All events');
  const resource = useResource('/events/mine',Boolean(account.data && organizerAllowed));
  const own = resource.data?.items || [];
  const items=own.filter(e=>tab==='All events'||e.status===({Drafts:'draft',Open:'open',Completed:'completed'}[tab]));

  return (
    <>
      <Heading eyebrow="ORGANIZER WORKSPACE" title={manage?'Your events, in one place.':'Make the next great team possible.'} description="Manage opportunities, review assessments, and help people do their best work.">
        <Action to="/organizer/create">Create event</Action>
      </Heading>
      {!organizerAllowed && (
        <div className="tw-notice">Sign in with your organizer account to load events. Verification is required before creating or hosting an event.</div>
      )}
      {!manage && (
        <Metrics items={[
          ["Open events",resource.data?own.filter(e=>e.status==='open').length:null,'Accepting registrations',CalendarDays],
          ["Registrations",resource.data?own.reduce((sum,e)=>sum+(e.registered_count||0),0):null,'Across your events',Users],
          ["Pending outcomes",overview.data?.outcomes.filter(o=>o.status==='pending').length,'Awaiting reviewed results',ClipboardCheck]
        ]}/>
      )}
      <Panel title="My events">
        <div className="tw-rowtabs" role="group" aria-label="Event status">
          {['All events','Drafts','Open','Completed'].map(t=>(
            <button key={t} className={tab===t?'active':''} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>
        <ResourceState resource={resource}>
          {items.length ? (
            <EventCards items={manage?items:items.slice(0,3)} organizer/>
          ) : (
            <Empty icon={CalendarDays} title="Your next event starts with a brief." description={resource.data?'No events match this view.':'Sign in with your organizer account to view events.'}>
              <Action to="/organizer/create">Create an event</Action>
            </Empty>
          )}
        </ResourceState>
      </Panel>
      {!manage && <div className="tw-formactions"><Action to="/organizer/events" secondary>View all events</Action><Action to="/organizer/roster" secondary>View participants</Action></div>}
    </>
  );
}
