CREATE TABLE "invite_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid,
	"code" text NOT NULL,
	"uid" text NOT NULL,
	"tenant_id" text,
	"ip" text,
	"user_agent" text,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "audit_log_tenant_created_idx";--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_uid" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "max_uses" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "used_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "is_evaluator" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "is_evaluator" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "converted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "converted_from_tenant_id" text;--> statement-breakpoint
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_invite_id_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."invites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_redemptions_code_idx" ON "invite_redemptions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invite_redemptions_uid_idx" ON "invite_redemptions" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "invite_redemptions_tenant_idx" ON "invite_redemptions" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invites_code_idx" ON "invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "invites_tenant_idx" ON "invites" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_uid_idx" ON "memberships" USING btree ("uid");--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_code_unique" UNIQUE("code");