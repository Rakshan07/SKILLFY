from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Literal
from backend.app.db.session import get_db
from .auth import current_user
from .db import one, rows, execute, require
router=APIRouter(tags=['Workspace'])

@router.get('/notifications/me')
def notifications(user=Depends(current_user), db=Depends(get_db)):
    return {'items': rows(db, '''SELECT id,title,body,target_path,read_at,created_at
      FROM hackloop.notifications WHERE user_id=:uid AND type='team_mention'
      ORDER BY created_at DESC LIMIT 50''',uid=user['id'])}

@router.post('/notifications/{nid}/read')
def read_notification(nid: UUID, user=Depends(current_user), db=Depends(get_db)):
    result=one(db, '''UPDATE hackloop.notifications SET read_at=COALESCE(read_at,now())
      WHERE id=:nid AND user_id=:uid RETURNING id''',nid=nid,uid=user['id'])
    require(result)
    db.commit()
    return result

@router.get('/workspace/me')
def workspace(user=Depends(current_user),db=Depends(get_db)):
    uid=user['id']
    progress=one(db,'SELECT * FROM hackloop.user_progress WHERE user_id=:uid',uid=uid) or {'total_xp':0,'level':None}
    next_level=one(db,'SELECT level,title,minimum_xp FROM hackloop.levels WHERE minimum_xp>:xp ORDER BY minimum_xp LIMIT 1',xp=progress['total_xp'])
    registrations=rows(db,'''SELECT e.id,e.title,e.category,e.starts_at,e.ends_at,e.registration_closes_at,
      e.registration_opens_at,e.description,e.min_team_size,e.max_team_size,e.prize_pool,
      o.name AS organizer_name,
      CASE WHEN e.cover_image IS NOT NULL THEN '/api/v1/events/' || e.id::text || '/image' END AS image_url,
      CASE e.event_mode WHEN 'online' THEN 'remote' WHEN 'onsite' THEN 'in-person' ELSE 'hybrid' END AS mode,
      r.status AS registration_status,
      CASE WHEN e.status='published' AND e.registration_opens_at<=now() AND e.registration_closes_at>now()
        THEN 'open' ELSE e.status::text END AS status
      FROM hackloop.event_registrations r JOIN hackloop.events e ON e.id=r.event_id LEFT JOIN hackloop.organizations o ON o.id=e.organization_id WHERE r.user_id=:uid AND r.status='registered' ORDER BY e.starts_at''',uid=uid)
    teams=rows(db,'''SELECT t.id,t.name,t.event_id,t.status,e.title AS event_title,e.category,m.membership_role AS role,m.assigned_role,e.max_team_size,
      CASE WHEN e.cover_image IS NOT NULL THEN '/api/v1/events/' || e.id::text || '/image' END AS image_url,
      (SELECT count(*) FROM hackloop.team_members active WHERE active.team_id=t.id AND active.left_at IS NULL) AS member_count,
      (SELECT json_agg(preview) FROM (SELECT u.display_name FROM hackloop.team_members tm
        JOIN hackloop.users u ON u.id=tm.user_id WHERE tm.team_id=t.id AND tm.left_at IS NULL ORDER BY tm.joined_at LIMIT 4) preview) AS members_preview
      FROM hackloop.team_members m
      JOIN hackloop.teams t ON t.id=m.team_id JOIN hackloop.events e ON e.id=t.event_id WHERE m.user_id=:uid AND m.left_at IS NULL ORDER BY m.joined_at DESC''',uid=uid)
    history=rows(db,'''SELECT h.*,c.role_description,c.contribution_summary,
      COALESCE((SELECT sum(x.points) FROM hackloop.xp_ledger x JOIN hackloop.event_outcomes o ON o.id=x.outcome_id WHERE x.user_id=h.user_id AND o.event_id=h.event_id),0) AS xp_earned
      FROM hackloop.participant_event_history h LEFT JOIN hackloop.event_contributions c ON c.user_id=h.user_id AND c.event_id=h.event_id AND c.review_status='approved'
      WHERE h.user_id=:uid ORDER BY h.ends_at DESC''',uid=uid)
    feedback=one(db,"SELECT count(*) AS count,avg(rating) AS rating FROM hackloop.event_peer_feedback WHERE reviewee_id=:uid AND review_status='approved'",uid=uid)
    contributions=one(db,"SELECT count(*) AS count FROM hackloop.event_contributions WHERE user_id=:uid AND review_status='approved'",uid=uid)['count']
    assessments=rows(db,'''SELECT s.id,s.event_id,s.status,s.submitted_at,s.evaluation_score,a.title,e.title AS event_title,e.category,
      CASE WHEN e.cover_image IS NOT NULL THEN '/api/v1/events/' || e.id::text || '/image' END AS image_url
      FROM hackloop.assessment_submissions s
      JOIN hackloop.assessments a ON a.id=s.assessment_id JOIN hackloop.events e ON e.id=s.event_id WHERE s.user_id=:uid ORDER BY s.created_at DESC''',uid=uid)
    return {'progress':progress,'next_level':next_level,'registrations':registrations,'teams':teams,'history':history,'feedback':feedback,'contributions':contributions,'assessments':assessments}

@router.get('/challenges/xp/me')
def xp(user=Depends(current_user),db=Depends(get_db)):
    return one(db,'SELECT * FROM hackloop.user_xp_totals WHERE user_id=:uid',uid=user['id'])

@router.get('/organizer/verification')
def verification(user=Depends(current_user),db=Depends(get_db)):
    return rows(db,'''SELECT o.id AS organization_id,o.name,v.id AS request_id,v.status,v.review_notes FROM hackloop.organization_members m
      JOIN hackloop.organizations o ON o.id=m.organization_id LEFT JOIN hackloop.organizer_verification_requests v ON v.organization_id=o.id
      WHERE m.user_id=:uid AND m.role IN ('owner','manager') ORDER BY v.created_at DESC''',uid=user['id'])

class VerificationRequest(BaseModel):
    organization_id: UUID
    evidence_storage_key: str=Field(min_length=1,max_length=500)
    applicant_notes: str=Field(default='',max_length=4000)
@router.post('/organizer/verification',status_code=201)
def apply(body:VerificationRequest,user=Depends(current_user),db=Depends(get_db)):
    require(False,422,'Submit your details and documents through organizer account setup')

class Decision(BaseModel):
    status:Literal['approved','rejected','revoked']
    review_notes:str=Field(min_length=1,max_length=4000)
@router.post('/admin/organizer-verifications/{rid}')
def decide(rid:UUID,body:Decision,user=Depends(current_user),db=Depends(get_db)):
    require('admin' in user['roles'],403,'Administrator permission required')
    r=require(one(db,'SELECT * FROM hackloop.organizer_verification_requests WHERE id=:id FOR UPDATE',id=rid))
    require(r['applicant_id']!=user['id'],403,'You cannot review your own application')
    if body.status=='approved':
        require(one(db,'SELECT 1 FROM hackloop.organizer_application_details WHERE request_id=:id',id=rid),422,'Complete details and documents are required before approval')
    require((r['status']=='pending' and body.status in ('approved','rejected')) or (r['status']=='approved' and body.status=='revoked'),409,'Invalid review transition')
    execute(db,'UPDATE hackloop.organizer_verification_requests SET status=:status,reviewed_by=:uid,reviewed_at=now(),review_notes=:notes WHERE id=:id',status=body.status,uid=user['id'],notes=body.review_notes,id=rid)
    execute(db,"INSERT INTO hackloop.audit_logs(actor_user_id,action,entity_type,entity_id) VALUES(:uid,:action,'organizer_verification',:id)",uid=user['id'],action='verification_'+body.status,id=str(rid))
    db.commit()
    return {'status':body.status}

@router.get('/workspace/suggestions')
def suggestions(user=Depends(current_user),db=Depends(get_db)):
    from .events import event_response
    result=rows(db,'''SELECT e.* FROM hackloop.events e
      WHERE e.status='published' AND e.registration_opens_at<=now() AND e.registration_closes_at>now()
      AND EXISTS (SELECT 1 FROM hackloop.event_roles r JOIN hackloop.event_role_skills rs ON rs.event_role_id=r.id
        JOIN hackloop.user_skills us ON us.skill_id=rs.skill_id WHERE r.event_id=e.id AND us.user_id=:uid)
      ORDER BY e.starts_at,e.id LIMIT 6''',uid=user['id'])
    return {'items':[event_response(db,e) for e in result]}

@router.get('/organizer/workspace')
def organizer_workspace(user=Depends(current_user),db=Depends(get_db)):
    require('organizer' in user['roles'] or 'admin' in user['roles'],403,'Organizer account required')
    return {'participants':rows(db,'''SELECT r.event_id,r.user_id,r.status,e.title AS event_title,u.display_name
      FROM hackloop.events e JOIN hackloop.event_registrations r ON r.event_id=e.id JOIN hackloop.users u ON u.id=r.user_id
      WHERE e.created_by=:uid ORDER BY r.registered_at DESC''',uid=user['id']),
      'teams':rows(db,'''SELECT t.*,e.title AS event_title FROM hackloop.teams t JOIN hackloop.events e ON e.id=t.event_id WHERE e.created_by=:uid ORDER BY t.created_at DESC''',uid=user['id']),
      'outcomes':rows(db,'''SELECT o.*,u.display_name,e.title AS event_title FROM hackloop.event_outcomes o JOIN hackloop.events e ON e.id=o.event_id
      JOIN hackloop.users u ON u.id=o.user_id WHERE e.created_by=:uid ORDER BY o.created_at DESC''',uid=user['id'])}
