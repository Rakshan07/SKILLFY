import Avatar from './Avatar';
import { getTeamFields } from './registrationFields';
import { Fragment, useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, UserPlus, Send, MessageSquare, Shield, Check, X, 
  ArrowRight, AlertCircle, RefreshCw, LogOut, ArrowLeft, Clock, Hash, AtSign, Search, Smile, Settings, ChevronDown
} from 'lucide-react';
import { Heading, Panel, ResourceState } from './Workspace';
import { request, useResource } from './api';
import { useWorkspaceAccount } from './account';

export function TeamManagement({ eventId }) {
  const [searchParams] = useSearchParams();
  const showCreateInit = searchParams.get('create') === '1';

  const { account } = useWorkspaceAccount();
  const currentUserId = account.data?.id;

  const eventRes = useResource(`/events/${encodeURIComponent(eventId)}`);
  const myTeamRes = useResource(`/events/${encodeURIComponent(eventId)}/my-team`);
  const teamMatchesRes = useResource(`/events/${encodeURIComponent(eventId)}/team-matches`);
  const myInvitesRes = useResource(`/events/${encodeURIComponent(eventId)}/my-requests`);

  const [activeTab, setActiveTab] = useState(showCreateInit ? 'create' : 'my_team');
  const [createForm, setCreateForm] = useState({ name: '', description: '', creator_role: '', seeking_roles: '' });
  const [creating, setCreating] = useState(false);
  const [joiningTeamId,setJoiningTeamId]=useState('');
  const [sentRequests,setSentRequests]=useState({});
  const joinInFlight=useRef(new Set());
  function requestSent(teamId) {
    return Boolean((sentRequests[teamId] && new Date(sentRequests[teamId])>new Date()) || myInvitesRes.data?.join_requests?.some(r=>r.team_id===teamId && new Date(r.expires_at)>new Date()));
  }
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const teamFields = getTeamFields(eventRes.data || {});
  const myTeamData = myTeamRes.data?.team;
  const hasTeam = myTeamRes.data?.has_team && Boolean(myTeamData);

  // If user has a team, default to My Team
  useEffect(() => {
    if (hasTeam && activeTab === 'create' && !showCreateInit) {
      setActiveTab('my_team');
    }
  }, [hasTeam]);

  async function handleCreateTeam(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    setActionNotice('');
    try {
      const payload = {
        name: createForm.name.trim().toUpperCase(),
        description: createForm.description.trim() || null,
        creator_role: createForm.creator_role.trim(),
        seeking_roles: createForm.seeking_roles.split(',').map(s => s.trim()).filter(Boolean)
      };
      await request(`/events/${encodeURIComponent(eventId)}/teams`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      myTeamRes.reload();
      setActiveTab('my_team');
      setActionNotice('Team created successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRequest(teamId, targetRole) {
    if(requestSent(teamId)||joinInFlight.current.has(teamId))return;
    joinInFlight.current.add(teamId);
    setJoiningTeamId(teamId);
    setError('');
    setActionNotice('');
    try {
      const result=await request(`/teams/${encodeURIComponent(teamId)}/join-requests`, {
        method: 'POST',
        body: JSON.stringify({ target_role: targetRole })
      });
      setSentRequests(prev=>({...prev,[teamId]:result.expires_at}));
      myInvitesRes.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      joinInFlight.current.delete(teamId);
      setJoiningTeamId('');
    }
  }

  async function handleRespondToInvite(requestId, decision) {
    setError('');
    setActionNotice('');
    try {
      await request(`/team-requests/${encodeURIComponent(requestId)}/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      setActionNotice(decision === 'accept' ? 'Invitation accepted! You have joined the team.' : 'Invitation declined.');
      myInvitesRes.reload();
      myTeamRes.reload();
      if (decision === 'accept') setActiveTab('my_team');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLeaveTeam() {
    if (!myTeamData) return;
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    setError('');
    try {
      await request(`/teams/${encodeURIComponent(myTeamData.id)}/leave`, { method: 'POST' });
      myTeamRes.reload();
      setActionNotice('You have left the team.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Heading
        eyebrow="TEAM FORMATION & COLLABORATION"
        title={hasTeam ? myTeamData.name.toUpperCase() : "Find your team."}
        description={eventRes.data?.title || ""}
      >
        <Link className="tw-button secondary" to={`/events/${encodeURIComponent(eventId)}`}>
          <ArrowLeft size={16} />Back to Event
        </Link>
      </Heading>

      {error && <div className="tw-notice" role="alert"><AlertCircle size={18} /> {error}</div>}
      {actionNotice && <div className="tw-notice" role="status"><Check size={18} /> {actionNotice}</div>}
      {myInvitesRes.error && !hasTeam && <div className="tw-notice" role="alert"><p>{myInvitesRes.error}</p><button className="tw-textbutton" onClick={myInvitesRes.reload}>Reload request status</button></div>}

      {/* Tabs */}
      <div className="tw-rowtabs" style={{ marginBottom: 20 }}>
        {hasTeam && (
          <button className={activeTab === 'my_team' ? 'active' : ''} onClick={() => setActiveTab('my_team')}>
            My Team & Chat
          </button>
        )}
        {!hasTeam && (
          <>
            <button className={activeTab === 'my_team' ? 'active' : ''} onClick={() => setActiveTab('my_team')}>
              Find Teams to Join
            </button>
            <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>
              Create a Team
            </button>
          </>
        )}
        {myInvitesRes.data?.invitations?.length > 0 && (
          <button className={activeTab === 'invites' ? 'active' : ''} onClick={() => setActiveTab('invites')}>
            Invitations ({myInvitesRes.data.invitations.length})
          </button>
        )}
      </div>

      {/* View 1: Invitations */}
      {activeTab === 'invites' && (
        <Panel title="Pending Team Invitations">
          <div style={{ padding: 20 }}>
            {myInvitesRes.data?.invitations?.length ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {myInvitesRes.data.invitations.map(inv => (
                  <div key={inv.id} className="tw-event-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{inv.team_name.toUpperCase()}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--sf-muted)' }}>
                        Invited by <strong>{inv.captain_name}</strong> for role: <strong>{inv.target_role}</strong>
                      </p>
                      {inv.message && <p style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>"{inv.message}"</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="tw-button" onClick={() => handleRespondToInvite(inv.id, 'accept')}>
                        <Check size={14} /> Accept
                      </button>
                      <button className="tw-button secondary" onClick={() => handleRespondToInvite(inv.id, 'decline')}>
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tw-empty"><p>No pending invitations.</p></div>
            )}
          </div>
        </Panel>
      )}

      {/* View 2: Create a Team (if user does not have team) */}
      {!hasTeam && activeTab === 'create' && (
        <Panel title="Start a New Team" description="Form a team, set your role, and invite complementary members.">
          <form onSubmit={handleCreateTeam} className="tw-formpanel tw-registration-form">
            <label className="tw-field">
              <span>Team Name</span>
              <input
                required
                minLength={2}
                maxLength={100}

                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value.toUpperCase() })}
              />
            </label>

            <label className="tw-field">
              <span>Your Role on the Team</span>
              <input
                required
                minLength={2}
                maxLength={100}
                list="team-role-options"
                value={createForm.creator_role}
                onChange={e => setCreateForm({ ...createForm, creator_role: e.target.value })}
              />
            </label>

            <datalist id="team-role-options">{teamFields.roles.map(role=><option key={role} value={role}/>)}</datalist>
            <label className="tw-field">
              <span>Roles You Are Seeking (separated by commas)</span>
              <input
                placeholder={teamFields.roles.slice(0,3).join(", ")}
                value={createForm.seeking_roles}
                onChange={e => setCreateForm({ ...createForm, seeking_roles: e.target.value })}
              />
            </label>

            <label className="tw-field">
              <span>{teamFields.descriptionLabel}</span>
              <textarea
                rows={3}
                placeholder={teamFields.descriptionHint}
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </label>

            <div className="tw-registration-suggestions" aria-label="Suggested team roles">{teamFields.roles.map(role=><button type="button" className="tw-chip" key={role} onClick={()=>setCreateForm(f=>({...f,seeking_roles:[...new Set([...f.seeking_roles.split(",").map(s=>s.trim()).filter(Boolean),role])].join(", ")}))}>+ {role}</button>)}</div>
            <div className="tw-formactions">
              <button className="tw-button" disabled={creating || eventRes.loading}>
                {creating ? 'Creating...' : 'Create Team'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* View 3: Find Teams to Join (if user does not have team) */}
      {!hasTeam && activeTab === 'my_team' && (
        <Panel title="Recruiting Teams" description="Teams seeking roles aligned with your assessed skills.">
          <div style={{ padding: 20 }}>
            {teamMatchesRes.data?.teams?.length ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {teamMatchesRes.data.teams.map(t => (
                  <div key={t.team_id} className="tw-event-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 17 }}>{t.name.toUpperCase()}</h3>
                          <span className="tw-badge">{t.member_count} / {t.max_team_size} members</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--sf-muted)', margin: '4px 0 8px' }}>
                          Leader: <strong>{t.creator_name}</strong>
                        </p>
                        {t.description && <p style={{ fontSize: 13, marginBottom: 8 }}>{t.description}</p>}
                        <div style={{ fontSize: 11, color: '#6A438A', background: '#F4EDFA', padding: '6px 12px', borderRadius: 6, display: 'inline-block' }}>
                          💡 <strong>Why this fits:</strong> {t.explanation}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="tw-badge" style={{ marginBottom: 10, fontSize: 12 }}>
                          Match Score: <strong>{Math.round(t.match_score)}%</strong>
                        </div>
                        <div>
                          <button 
                            className="tw-button"
                            disabled={Boolean(joiningTeamId) || requestSent(t.team_id) || myInvitesRes.loading || Boolean(myInvitesRes.error)}
                            aria-live="polite"
                            onClick={() => handleJoinRequest(t.team_id, t.recommended_role_for_you)}
                          >
                            {requestSent(t.team_id)?<><Check size={15}/>Request sent</>:joiningTeamId===t.team_id?'Sending…':<><UserPlus size={14}/>Request to join</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tw-empty">
                <Users size={32} style={{ color: 'var(--sf-muted)' }} />
                <h3>No recruiting teams yet</h3>
                <p>Be the first to create a team for this event and invite complementary participants.</p>
                <button className="tw-button" onClick={() => setActiveTab('create')}>Create a Team</button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* View 4: My Team Hub & Private Chat (if user has team) */}
      {hasTeam && activeTab === 'my_team' && (
        <TeamRoom key={myTeamData.id} team={myTeamData} event={eventRes.data} currentUserId={currentUserId} onLeave={handleLeaveTeam} onTeamUpdated={()=>myTeamRes.reload()}/>
      )}
    </>
  );
}

// ─── Captain Management Section ──────────────────────────────────────────────

function TeamRoom({team,event,currentUserId,onLeave,onTeamUpdated}) {
  const [view,setView]=useState('general');
  const [membersOpen,setMembersOpen]=useState(false);
  return <section className="tw-team-room" aria-label={`${team.name.toUpperCase()} team room`}>
    <aside className="tw-room-sidebar">
      <div className="tw-room-banner" style={event?.image_url?{backgroundImage:`linear-gradient(0deg,rgba(20,14,29,.94),rgba(20,14,29,.15)),url("${event.image_url}")`}:undefined}>
        <span className="tw-room-emblem">{team.name.slice(0,1).toUpperCase()}</span><strong>{team.name.toUpperCase()}</strong><span>{team.event_title || event?.title}</span>
      </div>
      <div className="tw-room-sidebar-body">
        <p className="tw-room-section-label">TEAM SPACE</p>
        <button className={`tw-room-navitem ${view==='mentions'?'active':''}`} onClick={()=>setView('mentions')}><AtSign size={19}/> Mentions</button>
        <div className="tw-room-section-label"><ChevronDown size={14}/> CHANNELS</div>
        <button className={`tw-room-navitem ${view==='general'?'active':''}`} onClick={()=>setView('general')}><Hash size={21}/> general <Users size={15}/></button>
        {team.is_captain&&<><p className="tw-room-section-label">LEADER TOOLS</p><button className={`tw-room-navitem ${view==='manage'?'active':''}`} onClick={()=>setView('manage')}><Settings size={18}/> Manage team</button></>}
        <div className="tw-room-space"/>
        <Link className="tw-room-navitem" to={`/events/${team.event_id}`}><ArrowLeft size={16}/>Back to event</Link>
        <p className="tw-room-capacity"><Users size={15}/>{team.members.length} / {team.max_team_size} members</p>
        <button className="tw-room-navitem tw-room-leave" onClick={onLeave}><LogOut size={17}/> Leave team</button>
      </div>
    </aside>
    <div className="tw-room-conversation">
      <button className="tw-room-member-toggle" aria-expanded={membersOpen} onClick={()=>setMembersOpen(!membersOpen)}><Users size={16}/>{membersOpen?'Hide members':'Show members'}</button>
      {view==='manage'?<div className="tw-room-management"><h2>Manage your team</h2><CaptainSection teamId={team.id} onTeamUpdated={onTeamUpdated}/></div>:<TeamChat teamId={team.id} currentUserId={currentUserId} members={team.members} view={view}/>}
    </div>
    <aside className={`tw-room-members ${membersOpen?'is-open':''}`} aria-label="Team members">
      <div className="tw-room-members-head"><strong>{team.name.toUpperCase()}</strong><span>{team.members.length} members</span></div>
      {['captain','member'].map(group=>{
        const list=team.members.filter(member=>group==='captain'?member.membership_role==='captain':member.membership_role!=='captain');
        return list.length>0&&<section className="tw-room-member-group" key={group}><h3>{group==='captain'?'Leader':'Members'} <span>— {list.length}</span></h3>{list.map(member=><div className="tw-room-member" key={member.membership_id}><Avatar userId={member.user_id} name={member.display_name} className="tw-room-member-avatar"/><div><strong>{member.display_name}{member.user_id===currentUserId&&<small> (you)</small>}</strong><span>{member.assigned_role || 'Contributor'}</span></div></div>)}</section>;
      })}
    </aside>
  </section>;
}

function CaptainSection({ teamId, onTeamUpdated }) {
  const candidatesRes = useResource(`/teams/${encodeURIComponent(teamId)}/candidates`);
  const requestsRes = useResource(`/teams/${encodeURIComponent(teamId)}/requests`);
  const [inbox,setInbox]=useState(null);
  useEffect(()=>{if(requestsRes.data)setInbox(requestsRes.data);},[requestsRes.data]);
  useEffect(()=>{
    let active=true;
    const timer=setInterval(()=>{request(`/teams/${encodeURIComponent(teamId)}/requests`).then(data=>{if(active)setInbox(data);}).catch(()=>{});},8000);
    return()=>{active=false;clearInterval(timer);};
  },[teamId]);
  const incomingRequests=(inbox?.requests || []).filter(r=>r.request_type==='join_request');
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function handleInvite(candidateUserId, suggestedRole) {
    setInviting(true);
    setNotice('');
    setError('');
    try {
      await request(`/teams/${encodeURIComponent(teamId)}/invitations`, {
        method: 'POST',
        body: JSON.stringify({
          candidate_user_id: candidateUserId,
          target_role: suggestedRole
        })
      });
      setNotice('Invitation sent!');
      candidatesRes.reload();
      requestsRes.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleDecision(requestId, decision) {
    setNotice('');
    setError('');
    try {
      await request(`/team-requests/${encodeURIComponent(requestId)}/respond`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      setNotice(decision === 'accept' ? 'Join request accepted!' : 'Join request declined.');
      requestsRes.reload();
      onTeamUpdated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 20, marginTop: 20 }}>
      <h3 style={{ fontSize: 16, margin: '0 0 6px' }}>Team management</h3>
      <p style={{ fontSize: 12, color: 'var(--sf-muted)', margin: '0 0 16px' }}>
        Manage candidate invitations and incoming join requests.
      </p>

      {notice && <div className="tw-notice" role="status"><Check size={16} /> {notice}</div>}
      {error && <div className="tw-notice" role="alert"><AlertCircle size={16} /> {error}</div>}

      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <strong style={{ fontSize: 13 }}>Incoming Join Requests ({incomingRequests.length}):</strong>
          <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
            {incomingRequests.map(req => (
              <div key={req.id} style={{ border: '1px solid var(--sf-border)', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{req.display_name}</strong> wishes to join as <em>{req.target_role}</em>
                  {req.assessment_score && <span className="tw-badge" style={{ marginLeft: 8 }}>{Math.round(req.assessment_score)}% score</span>}
                  {req.message && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--sf-muted)' }}>"{req.message}"</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="tw-button" onClick={() => handleDecision(req.id, 'accept')}>Accept</button>
                  <button className="tw-button secondary" onClick={() => handleDecision(req.id, 'decline')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Candidates */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ fontSize: 13 }}>Recommended Complementary Candidates:</strong>
          <button className="tw-textbutton" onClick={() => candidatesRes.reload()}><RefreshCw size={13} /> Refresh</button>
        </div>

        {candidatesRes.data?.candidates?.length ? (
          <div className="tw-candidate-grid">
            {candidatesRes.data.candidates.map(c => (
              <div key={c.user_id} className="tw-candidate-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: 14 }}>{c.display_name}</strong>
                    <span className="tw-badge">Match: {Math.round(c.match_score)}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sf-muted)', margin: '4px 0' }}>
                    Fills: <strong>{c.suggested_role}</strong> · {c.experience_level}
                  </div>
                  {c.assessment_score && (
                    <div style={{ fontSize: 11, color: '#2B6E38', marginBottom: 4 }}>
                      ✓ Assessed Score: {Math.round(c.assessment_score)}/100
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--sf-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>
                    {c.explanation}
                  </p>
                </div>
                <button 
                  className="tw-button" 
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={inviting}
                  onClick={() => handleInvite(c.user_id, c.suggested_role)}
                >
                  <UserPlus size={14} /> Invite to Team
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="tw-subtle">No unteamed matching candidates found for this event right now.</p>
        )}
      </div>
    </div>
  );
}

// ─── Private Team Chat Component ─────────────────────────────────────────────

function TeamChat({ teamId, currentUserId, members, view = "general" }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');
  const chatBottomRef = useRef(null);
  const wsRef = useRef(null);
  const [mentionOpen,setMentionOpen]=useState(false);
  const [search,setSearch]=useState('');
  const [showSearch,setShowSearch]=useState(false);
  const [emojiOpen,setEmojiOpen]=useState(false);
  const historyRef=useRef(null);
  const handleFor=m=>(m.display_name.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-|-$/g,'')+'-'+m.user_id.slice(0,8));
  const mentionOptions=[{label:'all',token:'all'},...members.filter(m=>m.user_id!==currentUserId).map(m=>({label:m.display_name,token:handleFor(m)}))];
  const query=inputText.match(/@([^@\n]*)$/)?.[1]?.toLowerCase() || '';
  const suggestions=mentionOptions.filter(m=>m.label.toLowerCase().includes(query)||m.token.includes(query));
  function insertMention(token){setInputText(text=>text.replace(/@[^@\n]*$/,'@'+token+' '));setMentionOpen(false);}
  function messageBody(text){return text.split(/(@[\p{L}\p{N}_-]+)/gu).map((part,i)=>{const match=mentionOptions.find(m=>'@'+m.token===part);return part.startsWith('@')?<mark key={i}>{match?'@'+match.label:part}</mark>:part;});}

  const myMember=members.find(m=>m.user_id===currentUserId);
  const mineHandle=myMember?handleFor(myMember):'';
  const visibleMessages=messages.filter(m=>{
    const mentioned=m.body.toLowerCase().includes('@all') || (mineHandle && m.body.toLowerCase().includes('@'+mineHandle)) || (myMember && m.body.toLowerCase().includes('@'+myMember.display_name.toLowerCase()));
    return (view!=='mentions'||mentioned) && (!search || (m.body+' '+m.sender_name).toLowerCase().includes(search.toLowerCase()));
  });

  // Initial message history load
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await request(`/teams/${encodeURIComponent(teamId)}/messages?limit=50`);
        if (res?.items) {
          setMessages(res.items);
          scrollToBottom();
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
    loadHistory();
  }, [teamId]);

  // WebSocket connection management with ephemeral chat ticket
  useEffect(() => {
    let unmounted = false;
    let ws = null;
    let reconnectTimeout = null;

    async function connectSocket() {
      try {
        const ticketRes = await request(`/teams/${encodeURIComponent(teamId)}/chat-ticket`, { method: 'POST' });
        if (unmounted || !ticketRes?.ticket) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to port 8000 (backend API server) or relative host
        const host = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host;
        const wsUrl = `${protocol}//${host}/api/v1/teams/${encodeURIComponent(teamId)}/ws?ticket=${ticketRes.ticket}`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!unmounted) setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
              setMessages(prev => {
                // Prevent duplicate message by ID or client_message_id
                if (prev.some(m => m.id === data.id || (data.client_message_id && m.client_message_id === data.client_message_id))) {
                  return prev;
                }
                return [...prev, {
                  id: data.id,
                  client_message_id: data.client_message_id,
                  sender_user_id: data.sender_user_id,
                  sender_name: data.sender_name,
                  body: data.body,
                  created_at: data.created_at,
                  is_self: data.sender_user_id === currentUserId
                }];
              });
              scrollToBottom();
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!unmounted) {
            setWsStatus('disconnected');
            // Auto-reconnect after 3 seconds
            reconnectTimeout = setTimeout(connectSocket, 3000);
          }
        };

        ws.onerror = () => {
          if (!unmounted) setWsStatus('disconnected');
        };
      } catch (err) {
        if (!unmounted) {
          setWsStatus('fallback_polling');
          reconnectTimeout = setTimeout(connectSocket, 5000);
        }
      }
    }

    connectSocket();

    return () => {
      unmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [teamId, currentUserId]);

  // Periodic polling fallback to guarantee messages never get lost if WS is disconnected
  useEffect(() => {
    if (wsStatus === 'connected') return;
    const interval = setInterval(async () => {
      try {
        const res = await request(`/teams/${encodeURIComponent(teamId)}/messages?limit=30`);
        if (res?.items) {
          setMessages(res.items);
        }
      } catch {
        /* Ignore background polling errors */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [teamId, wsStatus]);

  function scrollToBottom() {
    setTimeout(() => {
      const history=historyRef.current; if(history) history.scrollTo({top:history.scrollHeight,behavior:'smooth'});
    }, 50);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    const clientId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Send via HTTP endpoint to guarantee persistence and idempotency
      const sent = await request(`/teams/${encodeURIComponent(teamId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text, client_message_id: clientId })
      });

      setInputText('');

      // Add to local state immediately if not already broadcasted
      setMessages(prev => {
        if (prev.some(m => m.id === sent.id || m.client_message_id === clientId)) return prev;
        return [...prev, {
          id: sent.id,
          client_message_id: clientId,
          sender_user_id: currentUserId,
          sender_name: 'You',
          body: sent.body || text,
          created_at: sent.created_at,
          is_self: true
        }];
      });
      scrollToBottom();
    } catch (err) {
      alert(`Message failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="tw-chat-card">
      <div className="tw-chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hash size={22}/>
          <div><strong>{view==="mentions"?"Mentions":"general"}</strong><small className="tw-room-channel-subtitle">Team discussion, updates and coordination</small></div>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--sf-muted)' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: wsStatus === 'connected' ? '#2DA44E' : wsStatus === 'connecting' ? '#E0A020' : '#888'
          }} />
          <span>{wsStatus === "connected" ? "Connected" : "Reconnecting"}</span><button type="button" className="tw-room-icon-button" aria-label="Search messages" aria-expanded={showSearch} onClick={()=>{setShowSearch(!showSearch);setSearch("");}}><Search size={19}/></button>
        </div>
      </div>

      {showSearch&&<label className="tw-room-search"><Search size={16}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this conversation" aria-label="Search this conversation"/></label>}
      <div className="tw-chat-history" ref={historyRef}>
        {visibleMessages.length === 0 ? (
          <div className="tw-empty" style={{ margin: 'auto' }}>
            <MessageSquare size={24} style={{ color: 'var(--sf-muted)' }} />
            <h3>{view==="mentions"?"No mentions yet":"Welcome to #general"}</h3><p>{search?"No messages match your search.":view==="mentions"?"Your team mentions will appear here.":"This is the beginning of your team conversation."}</p>
          </div>
        ) : (
          visibleMessages.map((m,index) => (
            <Fragment key={m.id || m.client_message_id}>{(index===0 || new Date(visibleMessages[index-1].created_at).toDateString()!==new Date(m.created_at).toDateString())&&<div className="tw-room-day"><span>{new Date(m.created_at).toDateString()===new Date().toDateString()?"Today":new Date(m.created_at).toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"})}</span></div>}
            <div key={m.id || m.client_message_id} className="tw-chat-msg">
              <Avatar userId={m.sender_user_id} name={m.sender_name} className="tw-chat-avatar"/><div className="tw-chat-message-content"><div className="tw-chat-meta">
                <strong>{m.sender_user_id===currentUserId?(myMember?.display_name || m.sender_name):m.sender_name}</strong>{members.find(member=>member.user_id===m.sender_user_id)?.membership_role==="captain"&&<span className="tw-room-leader">Leader</span>}
                <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="tw-chat-text">{messageBody(m.body)}</div></div>
            </div>
            </Fragment>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      <form className="tw-chat-form" onSubmit={handleSendMessage}>
        {mentionOpen && suggestions.length>0 && <div className="tw-mention-picker" aria-label="Mention a teammate">{suggestions.map(m=><button key={m.token} type="button" onClick={()=>insertMention(m.token)}>@{m.label}</button>)}</div>}
        <textarea
          rows={1}
          aria-label="Message general"
          required
          maxLength={2000}
          placeholder="Message #general"
          value={inputText}
          onChange={e => {setInputText(e.target.value);setMentionOpen(/@[^@\n]*$/.test(e.target.value));}}
          onKeyDown={e=>{if(e.key==="Escape"){setMentionOpen(false);setEmojiOpen(false);}if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form.requestSubmit();}}}
          disabled={sending}
        />
        {emojiOpen&&<div className="tw-room-emojis" aria-label="Choose emoji">{["👍","🎉","😊","✅","🎵","💡","👋","🔥"].map(emoji=><button key={emoji} type="button" aria-label={emoji} onClick={()=>{setInputText(text=>text+emoji);setEmojiOpen(false);}}>{emoji}</button>)}</div>}
        <button className="tw-room-icon-button" type="button" aria-label="Insert emoji" aria-expanded={emojiOpen} onClick={()=>setEmojiOpen(!emojiOpen)}><Smile size={21}/></button>
        <button className="tw-room-send" aria-label="Send message" disabled={sending || !inputText.trim()}>
          <Send size={19} />
        </button>
      </form>
    </div>
  );
}

