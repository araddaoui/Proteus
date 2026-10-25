import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { inviteRedemptions, invites, memberships } from '../db/schema.js';
import { actorFrom, requireAuth, requireCapability, requireTenant } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import {
  createInvite,
  createMembership,
  getMembershipForTenant,
  getUser,
  listAllMemberships,
  listAudit,
  listInvites,
  revokeInvite,
  revokeMembership,
  writeAudit,
} from '../repositories/index.js';
import { auditQuerySchema, inviteCodeCreateSchema, inviteRedeemSchema, inviteSchema } from '../schemas.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireTenant);

adminRouter.get(
  '/memberships',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    const all = await listAllMemberships();
    res.json({
      data: all.filter(
        (item) => item.membership.tenantId === req.tenantId && item.membership.status === 'active',
      ),
    });
  }),
);

adminRouter.delete(
  '/memberships/:uid',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    if (req.params.uid === req.auth!.user.uid) {
      throw new AppError(409, 'CANNOT_REVOKE_SELF', 'You cannot revoke your own membership.');
    }
    const all = (await listAllMemberships()).filter(
      (item) =>
        item.membership.tenantId === req.tenantId &&
        item.membership.role === 'tenant_admin' &&
        item.membership.status === 'active',
    );
    if (all.length <= 1 && all.some((item) => item.uid === req.params.uid)) {
      throw new AppError(409, 'LAST_ADMIN', 'An institution must retain at least one administrator.');
    }
    const row = await revokeMembership(req.params.uid, req.tenantId!);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Membership not found.');
    await writeAudit(
      getDb(),
      actorFrom(req),
      {
        tenantId: req.tenantId,
        action: 'membership.revoke',
        targetType: 'membership',
        targetId: req.params.uid,
      },
    );
    res.json({ data: { uid: req.params.uid, status: 'revoked' } });
  }),
);

adminRouter.get(
  '/invites',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    res.json({ data: await listInvites(req.tenantId!) });
  }),
);

adminRouter.post(
  '/invites',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    const input = inviteSchema.parse(req.body);
    const invite = await createInvite({
      ...input,
      tenantId: req.tenantId!,
      invitedByUid: req.auth!.user.uid,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });
    await writeAudit(
      getDb(),
      actorFrom(req),
      {
        tenantId: req.tenantId,
        action: 'invite.create',
        targetType: 'invite',
        targetId: invite.id,
        after: { email: invite.email, code: invite.code, role: invite.role },
      },
    );
    res.status(201).json({ data: invite });
  }),
);

adminRouter.post(
  '/invites/codes',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    const input = inviteCodeCreateSchema.parse(req.body);
    if (input.tenantId !== req.tenantId) {
      throw new AppError(403, 'TENANT_FORBIDDEN', 'Cannot create codes for another tenant.');
    }
    const code = randomBytes(12).toString('base64url');
    const invite = await createInvite({
      tenantId: input.tenantId,
      code,
      role: input.role,
      title: input.title,
      governingBodyAffiliation: input.governingBodyAffiliation,
      capabilities: input.capabilities,
      invitedByUid: req.auth!.user.uid,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      maxUses: input.maxUses,
      isEvaluator: input.isEvaluator ?? true,
    });
    await writeAudit(
      getDb(),
      actorFrom(req),
      {
        tenantId: req.tenantId,
        action: 'invite.code.create',
        targetType: 'invite',
        targetId: invite.id,
        after: { code: invite.code, role: invite.role, maxUses: invite.maxUses },
      },
    );
    res.status(201).json({ data: { ...invite, code: invite.code } });
  }),
);

adminRouter.delete(
  '/invites/:id',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    const invite = await revokeInvite(req.tenantId!, req.params.id, req.auth!.user.uid);
    if (!invite) throw new AppError(404, 'NOT_FOUND', 'Invite not found.');
    await writeAudit(
      getDb(),
      actorFrom(req),
      {
        tenantId: req.tenantId,
        action: 'invite.revoke',
        targetType: 'invite',
        targetId: req.params.id,
      },
    );
    res.json({ data: { id: req.params.id, status: invite.status } });
  }),
);

adminRouter.get(
  '/audit',
  requireCapability('read_audit'),
  asyncHandler(async (req, res) => {
    const query = auditQuerySchema.parse(req.query);
    res.json({ data: await listAudit(req.tenantId!, query.limit || 100) });
  }),
);

adminRouter.post(
  '/memberships/convert',
  requireCapability('manage_members'),
  asyncHandler(async (req, res) => {
    const { uid, fromTenantId, toTenantId } = req.body as { uid: string; fromTenantId: string; toTenantId: string };
    if (!uid || !fromTenantId || !toTenantId) {
      throw new AppError(400, 'INVALID_INPUT', 'uid, fromTenantId, and toTenantId are required.');
    }
    const source = await getMembershipForTenant(uid, fromTenantId);
    if (!source) throw new AppError(404, 'NOT_FOUND', 'Source membership not found.');
    const membership = await createMembership({
      uid,
      tenantId: toTenantId,
      role: source.role,
      title: source.title,
      governingBodyAffiliation: source.governingBodyAffiliation,
      capabilities: source.capabilities,
      isEvaluator: false,
    });
    await getDb()
      .update(memberships)
      .set({ isEvaluator: false, convertedAt: new Date(), convertedFromTenantId: fromTenantId, updatedAt: new Date() })
      .where(and(eq(memberships.uid, uid), eq(memberships.tenantId, fromTenantId)));
    await writeAudit(
      getDb(),
      actorFrom(req),
      {
        tenantId: toTenantId,
        action: 'membership.convert',
        targetType: 'membership',
        targetId: uid,
        metadata: { fromTenantId, toTenantId },
      },
    );
    res.json({ data: membership });
  }),
);
