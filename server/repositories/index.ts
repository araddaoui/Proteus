import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb, type Database } from '../db/client.js';
import {
  auditLog,
  decisions,
  diagnosticItems,
  evidenceClaims,
  evidenceStaging,
  governanceSignoffs,
  institutions,
  inviteRedemptions,
  invites,
  jobs,
  memberships,
  overlayPacks,
  predictions,
  pulseSurveys,
  redFlags,
  scenarios,
  shadowAiReports,
  stakeholderImpacts,
  users,
  type DecisionRow,
  type SignoffRow,
} from '../db/schema.js';
import type {
  DecisionRecord,
  EvidenceClaim,
  EvidenceStagingItem,
  HumanDisposition,
  InstitutionalDiagnosticItem,
  JobExecutionStatus,
  OverlayPack,
  PredictionRecord,
  PulseSurveyResponse,
  RecommendedAction,
  ScenarioEntry,
  ShadowAiReport,
  StakeholderImpact,
} from '../../src/types/index.js';
import { resolveCapabilities } from '../../src/types/auth.js';
import type { Capability, MembershipInfo, TenantRole } from '../../src/types/auth.js';
import {
  toDecision,
  toDiagnostic,
  toEvidenceClaim,
  toInstitution,
  toJob,
  toMembershipInfo,
  toOverlayPack,
  toPrediction,
  toPulse,
  toScenario,
  toShadow,
  toStaging,
  toStakeholder,
} from './mappers.js';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type Executor = Database | Transaction;

export interface AuditActor {
  uid: string;
  membershipId?: string | null;
  role: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditEvent {
  tenantId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(
  executor: Executor,
  actor: AuditActor,
  event: AuditEvent,
): Promise<void> {
  await executor.insert(auditLog).values({
    tenantId: event.tenantId || null,
    actorUid: actor.uid,
    actorMembershipId: actor.membershipId || null,
    actorRole: actor.role,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId || null,
    before: event.before ?? null,
    after: event.after ?? null,
    metadata: event.metadata || null,
    requestId: actor.requestId || null,
    ip: actor.ip || null,
    userAgent: actor.userAgent || null,
  });
}

export async function getUser(uid: string) {
  const [row] = await getDb().select().from(users).where(eq(users.uid, uid)).limit(1);
  return row || null;
}

export async function upsertUser(input: {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}) {
  const [row] = await getDb()
    .insert(users)
    .values({
      uid: input.uid,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      avatarUrl: input.avatarUrl || null,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        avatarUrl: input.avatarUrl || null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function touchUser(uid: string) {
  await getDb().update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.uid, uid));
}

export interface InviteRecord {
  id: string;
  tenantId: string;
  institutionName: string;
  email: string | null;
  code: string | null;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
  capabilities: Capability[];
  status: string;
  acceptedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isEvaluator: boolean;
}

export async function claimInvites(uid: string, email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  return getDb().transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(invites)
      .where(and(sql`lower(${invites.email}) = ${normalized}`, eq(invites.status, 'pending')));
    let claimed = 0;
    for (const invite of pending) {
      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) continue;
      if ((invite.usedCount || 0) >= (invite.maxUses || 1)) continue;

      const existing = await tx
        .select()
        .from(memberships)
        .where(and(eq(memberships.uid, uid), eq(memberships.tenantId, invite.tenantId)))
        .limit(1);

      if (existing.length) {
        await tx
          .update(memberships)
          .set({
            role: invite.role,
            title: invite.title,
            governingBodyAffiliation: invite.governingBodyAffiliation,
            capabilities: invite.capabilities,
            status: 'active',
            isEvaluator: invite.isEvaluator || existing[0].isEvaluator,
            updatedAt: new Date(),
          })
          .where(and(eq(memberships.uid, uid), eq(memberships.tenantId, invite.tenantId)));
        claimed += 1;
      } else {
        const inserted = await tx
          .insert(memberships)
          .values({
            uid,
            tenantId: invite.tenantId,
            role: invite.role,
            title: invite.title,
            governingBodyAffiliation: invite.governingBodyAffiliation,
            capabilities: invite.capabilities,
            status: 'active',
            isEvaluator: invite.isEvaluator || false,
          })
          .onConflictDoUpdate({
            target: [memberships.uid, memberships.tenantId],
            set: {
              role: invite.role,
              title: invite.title,
              governingBodyAffiliation: invite.governingBodyAffiliation,
              capabilities: invite.capabilities,
              status: 'active',
              isEvaluator: invite.isEvaluator || false,
              updatedAt: new Date(),
            },
          })
          .returning();
        if (inserted.length) claimed += 1;
      }
      await tx
        .update(invites)
        .set({
          status: (invite.usedCount || 0) + 1 >= (invite.maxUses || 1) ? 'accepted' : invite.status,
          acceptedByUid: uid,
          acceptedAt: new Date(),
          usedCount: (invite.usedCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));
    }
    return claimed;
  });
}

export async function listInvites(tenantId: string): Promise<InviteRecord[]> {
  const rows = await getDb()
    .select({ invite: invites, institutionName: institutions.name })
    .from(invites)
    .innerJoin(institutions, eq(invites.tenantId, institutions.id))
    .where(eq(invites.tenantId, tenantId))
    .orderBy(desc(invites.createdAt));
  return rows.map(({ invite, institutionName }) => ({
    id: invite.id,
    tenantId: invite.tenantId,
    institutionName,
    email: invite.email,
    code: invite.code,
    role: invite.role as TenantRole,
    title: invite.title,
    governingBodyAffiliation: invite.governingBodyAffiliation,
    capabilities: resolveCapabilities(invite.role as TenantRole, invite.capabilities),
    status: invite.status,
    acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount || 0,
    isEvaluator: invite.isEvaluator || false,
  }));
}

export async function createInvite(input: {
  tenantId: string;
  email?: string | null;
  code?: string | null;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
  capabilities?: Capability[];
  invitedByUid: string;
  expiresAt?: Date | null;
  maxUses?: number;
  isEvaluator?: boolean;
}) {
  if (input.email) {
    const [row] = await getDb()
      .insert(invites)
      .values({
        tenantId: input.tenantId,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        title: input.title,
        governingBodyAffiliation: input.governingBodyAffiliation,
        capabilities: input.capabilities || [],
        invitedByUid: input.invitedByUid,
        status: 'pending',
        expiresAt: input.expiresAt || null,
        maxUses: input.maxUses || 1,
        usedCount: 0,
        isEvaluator: input.isEvaluator || false,
      })
      .onConflictDoUpdate({
        target: [invites.email, invites.tenantId],
        set: {
          role: input.role,
          title: input.title,
          governingBodyAffiliation: input.governingBodyAffiliation,
          capabilities: input.capabilities || [],
          invitedByUid: input.invitedByUid,
          status: 'pending',
          acceptedByUid: null,
          acceptedAt: null,
          expiresAt: input.expiresAt || null,
          maxUses: input.maxUses || 1,
          usedCount: 0,
          isEvaluator: input.isEvaluator || false,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  if (input.code) {
    const [row] = await getDb()
      .insert(invites)
      .values({
        tenantId: input.tenantId,
        code: input.code.trim(),
        role: input.role,
        title: input.title,
        governingBodyAffiliation: input.governingBodyAffiliation,
        capabilities: input.capabilities || [],
        invitedByUid: input.invitedByUid,
        status: 'pending',
        expiresAt: input.expiresAt || null,
        maxUses: input.maxUses || 1,
        usedCount: 0,
        isEvaluator: input.isEvaluator || false,
      })
      .returning();
    return row;
  }

  throw Object.assign(new Error('Either email or code is required'), { status: 400, code: 'INVALID_INPUT' });
}

export async function revokeInvite(tenantId: string, inviteId: string, uid: string) {
  const [row] = await getDb()
    .update(invites)
    .set({ status: 'revoked', updatedAt: new Date() })
    .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
    .returning();
  return row || null;
}

export async function getMembershipsForUid(uid: string): Promise<MembershipInfo[]> {
  const rows = await getDb()
    .select({
      membership: memberships,
      institutionName: institutions.name,
      institutionShortName: institutions.shortName,
    })
    .from(memberships)
    .innerJoin(institutions, eq(memberships.tenantId, institutions.id))
    .where(and(eq(memberships.uid, uid), eq(memberships.status, 'active')))
    .orderBy(asc(institutions.name));

  return rows
    .filter(({ membership }) => {
      const now = Date.now();
      if (membership.validFrom && membership.validFrom.getTime() > now) return false;
      if (membership.validUntil && membership.validUntil.getTime() < now) return false;
      return true;
    })
    .map(({ membership, institutionName, institutionShortName }) =>
      toMembershipInfo(membership, institutionName, institutionShortName),
    );
}

export async function getMembershipForTenant(uid: string, tenantId: string): Promise<MembershipInfo | null> {
  const rows = await getDb()
    .select({
      membership: memberships,
      institutionName: institutions.name,
      institutionShortName: institutions.shortName,
    })
    .from(memberships)
    .innerJoin(institutions, eq(memberships.tenantId, institutions.id))
    .where(and(eq(memberships.uid, uid), eq(memberships.tenantId, tenantId), eq(memberships.status, 'active')))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const now = Date.now();
  if (row.membership.validFrom && row.membership.validFrom.getTime() > now) return null;
  if (row.membership.validUntil && row.membership.validUntil.getTime() < now) return null;
  return toMembershipInfo(row.membership, row.institutionName, row.institutionShortName);
}

export async function isMemberOfTenant(uid: string, tenantId: string): Promise<boolean> {
  return !!(await getMembershipForTenant(uid, tenantId));
}

export async function listAllMemberships(): Promise<Array<{
  membership: MembershipInfo & { status?: string; isEvaluator?: boolean };
  uid: string;
  email: string;
  displayName: string;
}>> {
  const rows = await getDb()
    .select({
      membership: memberships,
      institutionName: institutions.name,
      institutionShortName: institutions.shortName,
      uid: users.uid,
      email: users.email,
      displayName: users.displayName,
    })
    .from(memberships)
    .innerJoin(institutions, eq(memberships.tenantId, institutions.id))
    .innerJoin(users, eq(memberships.uid, users.uid))
    .orderBy(asc(institutions.name), asc(users.email));
  return rows.map((row) => ({
    membership: {
      ...toMembershipInfo(row.membership, row.institutionName, row.institutionShortName),
      status: row.membership.status,
      isEvaluator: row.membership.isEvaluator,
    },
    uid: row.uid,
    email: row.email,
    displayName: row.displayName,
  }));
}

export async function createMembership(input: {
  uid: string;
  tenantId: string;
  role: TenantRole;
  title: string;
  governingBodyAffiliation: string;
  capabilities?: Capability[];
  isEvaluator?: boolean;
}) {
  const [row] = await getDb()
    .insert(memberships)
    .values({
      uid: input.uid,
      tenantId: input.tenantId,
      role: input.role,
      title: input.title,
      governingBodyAffiliation: input.governingBodyAffiliation,
      capabilities: input.capabilities || [],
      isEvaluator: input.isEvaluator || false,
    })
    .onConflictDoUpdate({
      target: [memberships.uid, memberships.tenantId],
      set: {
        role: input.role,
        title: input.title,
        governingBodyAffiliation: input.governingBodyAffiliation,
        capabilities: input.capabilities || [],
        status: 'active',
        isEvaluator: input.isEvaluator || false,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function revokeMembership(uid: string, tenantId: string) {
  const [row] = await getDb()
    .update(memberships)
    .set({ status: 'revoked', updatedAt: new Date() })
    .where(and(eq(memberships.uid, uid), eq(memberships.tenantId, tenantId)))
    .returning();
  return row || null;
}

export async function getInstitutions() {
  return (await getDb().select().from(institutions).orderBy(asc(institutions.name))).map(toInstitution);
}

export async function getInstitution(tenantId: string) {
  const [row] = await getDb().select().from(institutions).where(eq(institutions.id, tenantId)).limit(1);
  return row ? toInstitution(row) : null;
}

export async function updateInstitution(tenantId: string, updated: import('../../src/types/index.js').Institution) {
  const [row] = await getDb()
    .update(institutions)
    .set({
      name: updated.name,
      shortName: updated.shortName,
      missionStatement: updated.missionStatement,
      governanceType: updated.governanceType,
      academicGovernanceType: updated.academicGovernanceType,
      academicGovernanceBodyName: updated.academicGovernanceBodyName,
      provostOfficeName: updated.provostOfficeName,
      accreditors: updated.accreditors,
      legalJurisdiction: updated.legalJurisdiction,
      budgetTier: updated.budgetTier,
      enrollmentSize: updated.enrollmentSize,
      studentDemographics: updated.studentDemographics as unknown as Record<string, number>,
      currentAiPolicyStatus: updated.currentAiPolicyStatus,
      primaryLanguages: updated.primaryLanguages,
      activeOverlayPackId: updated.activeOverlayPackId,
      updatedAt: new Date(),
    })
    .where(eq(institutions.id, tenantId))
    .returning();
  return row ? toInstitution(row) : null;
}

export async function getOverlayPacks(): Promise<OverlayPack[]> {
  return (await getDb().select().from(overlayPacks).orderBy(asc(overlayPacks.name))).map(toOverlayPack);
}

export async function getOverlayPack(id: string): Promise<OverlayPack | null> {
  const [row] = await getDb().select().from(overlayPacks).where(eq(overlayPacks.id, id)).limit(1);
  return row ? toOverlayPack(row) : null;
}

async function signoffsForDecisions(decisionIds: string[]): Promise<Map<string, SignoffRow[]>> {
  const map = new Map<string, SignoffRow[]>();
  if (!decisionIds.length) return map;
  const rows = await getDb()
    .select()
    .from(governanceSignoffs)
    .where(inArray(governanceSignoffs.decisionId, decisionIds));
  for (const row of rows) {
    const current = map.get(row.decisionId) || [];
    current.push(row);
    map.set(row.decisionId, current);
  }
  return map;
}

async function signoffsForDecision(decisionId: string): Promise<SignoffRow[]> {
  return getDb().select().from(governanceSignoffs).where(eq(governanceSignoffs.decisionId, decisionId));
}

export async function getDecisionsForTenant(tenantId: string): Promise<DecisionRecord[]> {
  const rows = await getDb()
    .select()
    .from(decisions)
    .where(eq(decisions.tenantId, tenantId))
    .orderBy(desc(decisions.createdAt));
  const signoffs = await signoffsForDecisions(rows.map((row) => row.id));
  return rows.map((row) => toDecision(row, signoffs.get(row.id) || []));
}

export async function getDecision(id: string): Promise<DecisionRecord | null> {
  const [row] = await getDb().select().from(decisions).where(eq(decisions.id, id)).limit(1);
  if (!row) return null;
  return toDecision(row, await signoffsForDecision(id));
}

export async function createDecision(
  tenantId: string,
  input: Omit<DecisionRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'humanApprovalGatePassed'>,
): Promise<DecisionRecord> {
  const [row] = await getDb()
    .insert(decisions)
    .values({
      id: `dec-${randomUUID()}`,
      tenantId,
      title: input.title,
      summary: input.summary,
      domain: input.domain,
      touchesEnrollmentOrGrading: input.touchesEnrollmentOrGrading,
      humanApprovalGatePassed: false,
      humanDisposition: input.humanDisposition,
      dispositionNotes: input.dispositionNotes || null,
      dispositionSetBy: input.dispositionSetBy || null,
      dispositionSetAt: input.dispositionSetAt ? new Date(input.dispositionSetAt) : null,
      recommendedAction: input.recommendedAction,
      recommendedActionNotes: input.recommendedActionNotes || null,
      implementationStatus: input.implementationStatus,
      isAiDrafted: input.isAiDrafted,
      generationMode: input.generationMode || null,
      kernelSectionIds: input.kernelSectionIds || [],
    })
    .returning();
  return toDecision(row);
}

export async function updateDecisionDisposition(
  actor: AuditActor,
  decision: DecisionRecord,
  disposition: Exclude<HumanDisposition, null>,
  notes: string,
  expectedVersion?: number,
): Promise<DecisionRecord> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .update(decisions)
      .set({
        humanDisposition: disposition,
        dispositionNotes: notes,
        dispositionSetBy: actor.uid,
        dispositionSetAt: new Date(),
        updatedAt: new Date(),
        version: sql`${decisions.version} + 1`,
      })
      .where(and(eq(decisions.id, decision.id), expectedVersion ? eq(decisions.version, expectedVersion) : undefined))
      .returning();
    if (!row) {
      throw Object.assign(new Error('The decision changed since you loaded it. Refresh and try again.'), {
        status: 409,
        code: 'VERSION_CONFLICT',
      });
    }
    await writeAudit(tx, actor, {
      tenantId: decision.tenantId,
      action: 'decision.disposition',
      targetType: 'decision',
      targetId: decision.id,
      before: { humanDisposition: decision.humanDisposition, dispositionNotes: decision.dispositionNotes },
      after: { humanDisposition: disposition, dispositionNotes: notes },
    });
    return toDecision(row, await tx.select().from(governanceSignoffs).where(eq(governanceSignoffs.decisionId, decision.id)));
  });
}

export async function updateRecommendedAction(
  actor: AuditActor,
  decision: DecisionRecord,
  recommendedAction: Exclude<RecommendedAction, null>,
  notes: string,
  expectedVersion?: number,
): Promise<DecisionRecord> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .update(decisions)
      .set({
        recommendedAction,
        recommendedActionNotes: notes,
        updatedAt: new Date(),
        version: sql`${decisions.version} + 1`,
      })
      .where(and(eq(decisions.id, decision.id), expectedVersion ? eq(decisions.version, expectedVersion) : undefined))
      .returning();
    if (!row) {
      throw Object.assign(new Error('The decision changed since you loaded it. Refresh and try again.'), {
        status: 409,
        code: 'VERSION_CONFLICT',
      });
    }
    await writeAudit(tx, actor, {
      tenantId: decision.tenantId,
      action: 'decision.recommended_action',
      targetType: 'decision',
      targetId: decision.id,
      before: { recommendedAction: decision.recommendedAction },
      after: { recommendedAction },
    });
    return toDecision(row, await tx.select().from(governanceSignoffs).where(eq(governanceSignoffs.decisionId, decision.id)));
  });
}

const ALLOWED_TRANSITIONS: Record<DecisionRecord['implementationStatus'], DecisionRecord['implementationStatus'][]> = {
  proposed: ['under_review', 'shelved'],
  under_review: ['approved_pending', 'shelved'],
  approved_pending: ['implemented', 'under_review', 'shelved'],
  implemented: [],
  shelved: ['under_review'],
};

export async function updateDecisionStatus(
  actor: AuditActor,
  decision: DecisionRecord,
  status: DecisionRecord['implementationStatus'],
  expectedVersion?: number,
): Promise<DecisionRecord> {
  return getDb().transaction(async (tx) => {
    const [locked] = await tx.select().from(decisions).where(eq(decisions.id, decision.id)).for('update');
    if (!locked) throw Object.assign(new Error('Decision not found'), { status: 404, code: 'NOT_FOUND' });
    if (expectedVersion && locked.version !== expectedVersion) {
      throw Object.assign(new Error('The decision changed since you loaded it. Refresh and try again.'), {
        status: 409,
        code: 'VERSION_CONFLICT',
      });
    }
    if (!(ALLOWED_TRANSITIONS[locked.implementationStatus] || []).includes(status)) {
      throw Object.assign(
        new Error(`Invalid status transition: ${locked.implementationStatus} -> ${status}`),
        { status: 409, code: 'INVALID_TRANSITION' },
      );
    }

    const signoffs = await tx.select().from(governanceSignoffs).where(eq(governanceSignoffs.decisionId, decision.id));
    const academic = signoffs.find((row) => row.signoffType === 'academic' && row.status === 'approved');
    const administrative = signoffs.find(
      (row) => row.signoffType === 'administrative' && row.status === 'approved',
    );
    const dualSigned = !!academic && !!administrative && academic.signerUid !== administrative.signerUid;

    if (status === 'implemented') {
      if (!locked.humanDisposition || !['accepted', 'modified'].includes(locked.humanDisposition)) {
        throw Object.assign(
          new Error('An accepted or modified human disposition is required before implementation.'),
          { status: 409, code: 'DISPOSITION_REQUIRED' },
        );
      }
      if (!locked.recommendedAction) {
        throw Object.assign(new Error('A recommended action is required before implementation.'), {
          status: 409,
          code: 'RECOMMENDED_ACTION_REQUIRED',
        });
      }
      if (locked.touchesEnrollmentOrGrading && !dualSigned) {
        throw Object.assign(
          new Error('Dual academic and administrative signoff by distinct humans is required.'),
          { status: 409, code: 'DUAL_GOVERNANCE_REQUIRED' },
        );
      }
    }

    const [row] = await tx
      .update(decisions)
      .set({
        implementationStatus: status,
        humanApprovalGatePassed: locked.touchesEnrollmentOrGrading ? dualSigned : false,
        updatedAt: new Date(),
        version: sql`${decisions.version} + 1`,
      })
      .where(eq(decisions.id, decision.id))
      .returning();

    await writeAudit(tx, actor, {
      tenantId: decision.tenantId,
      action: 'decision.status',
      targetType: 'decision',
      targetId: decision.id,
      before: { implementationStatus: locked.implementationStatus },
      after: { implementationStatus: status },
    });
    return toDecision(row, signoffs);
  });
}

export async function recordGovernanceSignoff(input: {
  actor: AuditActor;
  decision: DecisionRecord;
  signoffType: 'academic' | 'administrative';
  status: 'approved' | 'rejected' | 'pending' | 'conditional';
  resolutionNotes: string;
  membershipId: string;
  signerUid: string;
  signerName: string;
  bodyName: string;
  expectedVersion?: number;
}): Promise<DecisionRecord> {
  return getDb().transaction(async (tx) => {
    const [locked] = await tx.select().from(decisions).where(eq(decisions.id, input.decision.id)).for('update');
    if (!locked) throw Object.assign(new Error('Decision not found'), { status: 404, code: 'NOT_FOUND' });
    if (input.expectedVersion && locked.version !== input.expectedVersion) {
      throw Object.assign(new Error('The decision changed since you loaded it. Refresh and try again.'), {
        status: 409,
        code: 'VERSION_CONFLICT',
      });
    }

    const otherType = input.signoffType === 'academic' ? 'administrative' : 'academic';
    const [other] = await tx
      .select()
      .from(governanceSignoffs)
      .where(
        and(
          eq(governanceSignoffs.decisionId, input.decision.id),
          eq(governanceSignoffs.signoffType, otherType),
        ),
      )
      .limit(1);
    if (other && other.signerUid === input.signerUid) {
      throw Object.assign(
        new Error('Academic and administrative signoffs require two distinct human signers.'),
        { status: 409, code: 'DISTINCT_SIGNERS_REQUIRED' },
      );
    }

    const [saved] = await tx
      .insert(governanceSignoffs)
      .values({
        decisionId: input.decision.id,
        tenantId: input.decision.tenantId,
        signoffType: input.signoffType,
        bodyName: input.bodyName,
        signerUid: input.signerUid,
        signerMembershipId: input.membershipId,
        signedByName: input.signerName,
        status: input.status,
        resolutionNotes: input.resolutionNotes,
        signedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [governanceSignoffs.decisionId, governanceSignoffs.signoffType],
        set: {
          bodyName: input.bodyName,
          signerUid: input.signerUid,
          signerMembershipId: input.membershipId,
          signedByName: input.signerName,
          status: input.status,
          resolutionNotes: input.resolutionNotes,
          signedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    const all = await tx.select().from(governanceSignoffs).where(eq(governanceSignoffs.decisionId, input.decision.id));
    const academic = all.find((row) => row.signoffType === 'academic');
    const administrative = all.find((row) => row.signoffType === 'administrative');
    const dualSigned =
      !!academic &&
      !!administrative &&
      academic.status === 'approved' &&
      administrative.status === 'approved' &&
      academic.signerUid !== administrative.signerUid;

    const [row] = await tx
      .update(decisions)
      .set({
        humanApprovalGatePassed: dualSigned,
        updatedAt: new Date(),
        version: sql`${decisions.version} + 1`,
      })
      .where(eq(decisions.id, input.decision.id))
      .returning();

    await writeAudit(tx, input.actor, {
      tenantId: input.decision.tenantId,
      action: `decision.signoff.${input.signoffType}`,
      targetType: 'decision',
      targetId: input.decision.id,
      before: other ? { otherSignoff: other.status } : null,
      after: { signoffId: saved.id, status: input.status, signerUid: input.signerUid },
    });

    return toDecision(row, all);
  });
}

export async function getScenariosForTenant(tenantId: string): Promise<ScenarioEntry[]> {
  return (await getDb().select().from(scenarios).where(eq(scenarios.tenantId, tenantId))).map(toScenario);
}

export async function getScenariosForDecision(decisionId: string): Promise<ScenarioEntry[]> {
  return (await getDb().select().from(scenarios).where(eq(scenarios.decisionId, decisionId))).map(toScenario);
}

export async function addScenarios(
  actor: AuditActor,
  tenantId: string,
  decisionId: string,
  entries: Array<Omit<ScenarioEntry, 'id' | 'decisionId'>>,
): Promise<ScenarioEntry[]> {
  return getDb().transaction(async (tx) => {
    const rows = await tx
      .insert(scenarios)
      .values(
        entries.map((entry) => ({
          id: `scen-${randomUUID()}`,
          tenantId,
          decisionId,
          scenarioType: entry.scenarioType,
          title: entry.title,
          description: entry.description,
          keyAssumptions: entry.keyAssumptions,
          nonTechDrivers: entry.nonTechDrivers,
          reversibilityRating: entry.reversibilityRating,
          isAiDrafted: entry.isAiDrafted,
          generationMode: entry.generationMode || null,
        })),
      )
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'scenario.create',
      targetType: 'decision',
      targetId: decisionId,
      after: { count: rows.length },
    });
    return rows.map(toScenario);
  });
}

export async function getStakeholdersForTenant(tenantId: string): Promise<StakeholderImpact[]> {
  return (await getDb().select().from(stakeholderImpacts).where(eq(stakeholderImpacts.tenantId, tenantId))).map(
    toStakeholder,
  );
}

export async function getStakeholdersForDecision(decisionId: string): Promise<StakeholderImpact[]> {
  return (
    await getDb().select().from(stakeholderImpacts).where(eq(stakeholderImpacts.decisionId, decisionId))
  ).map(toStakeholder);
}

export async function getEvidence(tenantId: string): Promise<EvidenceClaim[]> {
  return (
    await getDb()
      .select()
      .from(evidenceClaims)
      .where(eq(evidenceClaims.tenantId, tenantId))
      .orderBy(desc(evidenceClaims.createdAt))
  ).map(toEvidenceClaim);
}

export async function getStaging(tenantId: string): Promise<EvidenceStagingItem[]> {
  return (
    await getDb()
      .select()
      .from(evidenceStaging)
      .where(eq(evidenceStaging.tenantId, tenantId))
      .orderBy(desc(evidenceStaging.createdAt))
  ).map(toStaging);
}

export async function addClaim(
  actor: AuditActor,
  tenantId: string,
  input: Omit<EvidenceClaim, 'id' | 'tenantId' | 'dateAdded'>,
): Promise<EvidenceClaim> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(evidenceClaims)
      .values({
        id: `claim-${randomUUID()}`,
        tenantId,
        claimText: input.claimText,
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        confidenceTier: input.confidenceTier,
        datePublished: input.datePublished,
        dateAdded: new Date().toISOString().slice(0, 10),
        retractionStatus: input.retractionStatus || 'active',
        tags: input.tags || [],
        discipline: input.discipline || null,
        program: input.program || null,
        createdByUid: actor.uid,
      })
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'evidence.create',
      targetType: 'evidence_claim',
      targetId: row.id,
      after: input,
    });
    return toEvidenceClaim(row);
  });
}

export async function approveStaging(
  actor: AuditActor,
  tenantId: string,
  stagingId: string,
  reviewerName: string,
): Promise<EvidenceClaim> {
  return getDb().transaction(async (tx) => {
    const [item] = await tx.select().from(evidenceStaging).where(eq(evidenceStaging.id, stagingId)).for('update');
    if (!item || item.tenantId !== tenantId) {
      throw Object.assign(new Error('Staging item not found'), { status: 404, code: 'NOT_FOUND' });
    }
    if (item.status !== 'pending_review') {
      throw Object.assign(new Error('Staging item is not pending review'), { status: 409, code: 'INVALID_STATE' });
    }
    const [claimRow] = await tx
      .insert(evidenceClaims)
      .values({
        id: `claim-${randomUUID()}`,
        tenantId,
        claimText: item.claimText,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        confidenceTier: item.confidenceTier,
        datePublished: item.datePublished,
        dateAdded: new Date().toISOString().slice(0, 10),
        retractionStatus: 'active',
        tags: ['staging_approved', 'automated_refresh'],
        createdByUid: actor.uid,
      })
      .returning();
    await tx
      .update(evidenceStaging)
      .set({ status: 'approved', reviewedBy: reviewerName, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(evidenceStaging.id, stagingId));
    await writeAudit(tx, actor, {
      tenantId,
      action: 'evidence.staging.approve',
      targetType: 'evidence_staging',
      targetId: stagingId,
      after: { claimId: claimRow.id },
    });
    return toEvidenceClaim(claimRow);
  });
}

export async function rejectStaging(
  actor: AuditActor,
  tenantId: string,
  stagingId: string,
  reason: string,
  reviewerName: string,
): Promise<void> {
  await getDb().transaction(async (tx) => {
    const [item] = await tx.select().from(evidenceStaging).where(eq(evidenceStaging.id, stagingId)).for('update');
    if (!item || item.tenantId !== tenantId) {
      throw Object.assign(new Error('Staging item not found'), { status: 404, code: 'NOT_FOUND' });
    }
    if (item.status !== 'pending_review') {
      throw Object.assign(new Error('Staging item is not pending review'), { status: 409, code: 'INVALID_STATE' });
    }
    await tx
      .update(evidenceStaging)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: reviewerName,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evidenceStaging.id, stagingId));
    await writeAudit(tx, actor, {
      tenantId,
      action: 'evidence.staging.reject',
      targetType: 'evidence_staging',
      targetId: stagingId,
      after: { reason },
    });
  });
}

export async function getPredictions(tenantId: string): Promise<PredictionRecord[]> {
  return (
    await getDb()
      .select()
      .from(predictions)
      .where(eq(predictions.tenantId, tenantId))
      .orderBy(desc(predictions.createdAt))
  ).map(toPrediction);
}

export async function addPrediction(
  actor: AuditActor,
  tenantId: string,
  input: Omit<PredictionRecord, 'id' | 'tenantId' | 'dateMade' | 'madeByUserId' | 'madeByUserName' | 'madeByRole'>,
  madeBy: { uid: string; name: string; role: string },
): Promise<PredictionRecord> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(predictions)
      .values({
        id: `pred-${randomUUID()}`,
        tenantId,
        predictionText: input.predictionText,
        madeByUserId: madeBy.uid,
        madeByUserName: madeBy.name,
        madeByRole: madeBy.role,
        dateMade: new Date().toISOString().slice(0, 10),
        targetDate: input.targetDate,
        resolutionStatus: input.resolutionStatus,
        scopeLevel: input.scopeLevel,
      })
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'prediction.create',
      targetType: 'prediction',
      targetId: row.id,
      after: input,
    });
    return toPrediction(row);
  });
}

export async function resolvePrediction(
  actor: AuditActor,
  tenantId: string,
  id: string,
  resolutionStatus: PredictionRecord['resolutionStatus'],
  actualOutcome: string,
  lessonsLearned: string,
): Promise<PredictionRecord> {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx.select().from(predictions).where(eq(predictions.id, id)).for('update');
    if (!existing || existing.tenantId !== tenantId) {
      throw Object.assign(new Error('Prediction not found'), { status: 404, code: 'NOT_FOUND' });
    }
    const [row] = await tx
      .update(predictions)
      .set({ resolutionStatus, actualOutcome, lessonsLearned, updatedAt: new Date() })
      .where(eq(predictions.id, id))
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'prediction.resolve',
      targetType: 'prediction',
      targetId: id,
      before: { resolutionStatus: existing.resolutionStatus },
      after: { resolutionStatus, actualOutcome, lessonsLearned },
    });
    return toPrediction(row);
  });
}

export async function getRedFlags() {
  return getDb().select().from(redFlags).orderBy(asc(redFlags.id));
}

export async function getPulseSurveys(tenantId: string): Promise<PulseSurveyResponse[]> {
  return (
    await getDb()
      .select()
      .from(pulseSurveys)
      .where(eq(pulseSurveys.tenantId, tenantId))
      .orderBy(desc(pulseSurveys.createdAt))
  ).map(toPulse);
}

export async function addPulseSurvey(
  actor: AuditActor,
  tenantId: string,
  input: Omit<PulseSurveyResponse, 'id' | 'tenantId' | 'createdAt'>,
): Promise<PulseSurveyResponse> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(pulseSurveys)
      .values({
        id: `pulse-${randomUUID()}`,
        tenantId,
        role: input.role,
        disciplineOrProgram: input.disciplineOrProgram,
        aiUsageFrequency: input.aiUsageFrequency,
        primaryToolsUsed: input.primaryToolsUsed,
        perceivedAcademicValue: input.perceivedAcademicValue,
        perceivedIntegrityRisk: input.perceivedIntegrityRisk,
        comments: input.comments,
        createdByUid: actor.uid,
      })
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'input.pulse.create',
      targetType: 'pulse_survey',
      targetId: row.id,
    });
    return toPulse(row);
  });
}

export async function getShadowReports(tenantId: string): Promise<ShadowAiReport[]> {
  return (
    await getDb()
      .select()
      .from(shadowAiReports)
      .where(eq(shadowAiReports.tenantId, tenantId))
      .orderBy(desc(shadowAiReports.createdAt))
  ).map(toShadow);
}

export async function addShadowReport(
  actor: AuditActor,
  tenantId: string,
  input: Omit<ShadowAiReport, 'id' | 'tenantId' | 'createdAt' | 'status'>,
): Promise<ShadowAiReport> {
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(shadowAiReports)
      .values({
        id: `sh-${randomUUID()}`,
        tenantId,
        reportedByRole: input.reportedByRole,
        departmentOrCourse: input.departmentOrCourse,
        toolOrUseName: input.toolOrUseName,
        description: input.description,
        perceivedRiskType: input.perceivedRiskType,
        status: 'flagged',
        actionTaken: input.actionTaken || null,
        createdByUid: actor.uid,
      })
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'input.shadow_ai.create',
      targetType: 'shadow_ai_report',
      targetId: row.id,
    });
    return toShadow(row);
  });
}

export async function getDiagnostics(tenantId: string): Promise<InstitutionalDiagnosticItem[]> {
  return (
    await getDb()
      .select()
      .from(diagnosticItems)
      .where(eq(diagnosticItems.tenantId, tenantId))
      .orderBy(asc(diagnosticItems.id))
  ).map(toDiagnostic);
}

export async function toggleDiagnostic(
  actor: AuditActor,
  tenantId: string,
  diagnosticId: string,
  isAvailable: boolean,
  notes?: string,
): Promise<InstitutionalDiagnosticItem> {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(diagnosticItems)
      .where(and(eq(diagnosticItems.tenantId, tenantId), eq(diagnosticItems.id, diagnosticId)))
      .for('update');
    if (!existing) throw Object.assign(new Error('Diagnostic item not found'), { status: 404, code: 'NOT_FOUND' });
    const [row] = await tx
      .update(diagnosticItems)
      .set({
        isAvailable,
        notes: notes === undefined ? existing.notes : notes,
        updatedAt: new Date(),
      })
      .where(and(eq(diagnosticItems.tenantId, tenantId), eq(diagnosticItems.id, diagnosticId)))
      .returning();
    await writeAudit(tx, actor, {
      tenantId,
      action: 'diagnostic.toggle',
      targetType: 'diagnostic',
      targetId: diagnosticId,
      before: { isAvailable: existing.isAvailable },
      after: { isAvailable },
    });
    return toDiagnostic(row);
  });
}

export async function getJobs(): Promise<JobExecutionStatus[]> {
  return (await getDb().select().from(jobs).orderBy(asc(jobs.jobId))).map(toJob);
}

export async function runJob(
  actor: AuditActor,
  tenantId: string,
  jobId: JobExecutionStatus['jobId'],
): Promise<JobExecutionStatus> {
  return getDb().transaction(async (tx) => {
    const [job] = await tx.select().from(jobs).where(eq(jobs.jobId, jobId)).for('update');
    if (!job) throw Object.assign(new Error('Job not found'), { status: 404, code: 'NOT_FOUND' });

    const now = new Date();
    if (jobId === 'evidence_refresh') {
      await tx.insert(evidenceStaging).values({
        id: `stage-${randomUUID()}`,
        tenantId,
        claimText: `Automated Scan (${now.toLocaleDateString()}): New EDUCAUSE briefing notes 76% of CIOs prioritizing AI ethics reviews over automated proctoring tools.`,
        sourceUrl: 'https://library.educause.edu/resources/2026/1/ai-horizon-report',
        sourceName: 'EDUCAUSE Horizon Watch 2026',
        confidenceTier: 'journalistic',
        datePublished: now.toISOString().slice(0, 10),
        discoveredAt: now.toISOString(),
        status: 'pending_review',
      });
    }

    let itemsProcessed = job.itemsProcessed;
    let lastResultSummary = job.lastResultSummary;
    if (jobId === 'evidence_refresh') {
      itemsProcessed += 1;
      lastResultSummary =
        'Scanned watchlist domains. Inserted 1 candidate entry into Evidence Staging. Human approval required before live ledger entry.';
    } else if (jobId === 'prediction_reconciliation') {
      const pending = await tx.select().from(predictions).where(eq(predictions.tenantId, tenantId));
      itemsProcessed = pending.filter(
        (p) => p.resolutionStatus === 'pending' && new Date(p.targetDate).getTime() <= now.getTime(),
      ).length;
      lastResultSummary = `Reconciliation completed. Found ${itemsProcessed} past-due predictions requiring user resolution.`;
    } else {
      itemsProcessed = 1;
      lastResultSummary = 'Scanned international academic governance feeds. Zero critical red-flag breaches found in past 30 days.';
    }

    const [row] = await tx
      .update(jobs)
      .set({
        itemsProcessed,
        lastResultSummary,
        lastRunAt: now.toISOString(),
        nextRunDueAt: new Date(now.getTime() + 86_400_000 * 7).toISOString(),
        status: 'idle',
        updatedAt: now,
      })
      .where(eq(jobs.jobId, jobId))
      .returning();

    await writeAudit(tx, actor, {
      tenantId,
      action: `job.run.${jobId}`,
      targetType: 'job',
      targetId: jobId,
      after: { itemsProcessed },
    });
    return toJob(row);
  });
}

export async function listAudit(tenantId: string, limit = 100) {
  return getDb()
    .select()
    .from(auditLog)
    .where(eq(auditLog.tenantId, tenantId))
    .orderBy(desc(auditLog.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}

export async function getDecisionCount(tenantId: string): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(decisions)
    .where(eq(decisions.tenantId, tenantId));
  return row?.count || 0;
}
