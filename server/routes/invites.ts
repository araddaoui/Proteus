import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { inviteRedemptions, invites, memberships } from '../db/schema.js';
import { actorFrom, requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errors.js';
import { createMembership, writeAudit } from '../repositories/index.js';
import { inviteRedeemSchema } from '../schemas.js';

export const inviteRouter = Router();

inviteRouter.post(
  '/redeem',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = inviteRedeemSchema.parse(req.body);
    const code = input.code.trim();

    const [invite] = await getDb()
      .select()
      .from(invites)
      .where(and(eq(invites.code, code), eq(invites.status, 'pending')))
      .limit(1);

    if (!invite) throw new AppError(404, 'NOT_FOUND', 'Invalid or expired invite code.');
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new AppError(410, 'EXPIRED', 'This invite code has expired.');
    }
    if ((invite.usedCount || 0) >= (invite.maxUses || 1)) {
      throw new AppError(409, 'EXHAUSTED', 'This invite code has already been used.');
    }

    await getDb().transaction(async (tx) => {
      await createMembership({
        uid: req.auth!.user.uid,
        tenantId: invite.tenantId,
        role: invite.role,
        title: invite.title,
        governingBodyAffiliation: invite.governingBodyAffiliation,
        capabilities: invite.capabilities,
        isEvaluator: invite.isEvaluator ?? true,
      });

      await tx
        .update(invites)
        .set({
          status: (invite.usedCount || 0) + 1 >= (invite.maxUses || 1) ? 'accepted' : invite.status,
          acceptedByUid: req.auth!.user.uid,
          acceptedAt: new Date(),
          usedCount: (invite.usedCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(invites.id, invite.id));

      await tx.insert(inviteRedemptions).values({
        id: randomUUID(),
        inviteId: invite.id,
        code,
        uid: req.auth!.user.uid,
        tenantId: invite.tenantId,
        ip: req.ip,
        userAgent: req.header('user-agent') || undefined,
      });

      await writeAudit(tx, actorFrom(req), {
        tenantId: invite.tenantId,
        action: 'invite.redeem',
        targetType: 'invite',
        targetId: invite.id,
        metadata: { code },
      });
    });

    res.json({ data: { tenantId: invite.tenantId, role: invite.role, isEvaluator: invite.isEvaluator ?? true } });
  }),
);
