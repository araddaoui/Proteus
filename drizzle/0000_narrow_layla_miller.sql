CREATE TYPE "public"."decision_status" AS ENUM('proposed', 'under_review', 'approved_pending', 'implemented', 'shelved');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('idle', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'suspended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."prediction_status" AS ENUM('pending', 'correct', 'incorrect', 'partially_correct');--> statement-breakpoint
CREATE TYPE "public"."signoff_status" AS ENUM('pending', 'approved', 'rejected', 'conditional');--> statement-breakpoint
CREATE TYPE "public"."signoff_type" AS ENUM('academic', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."staging_status" AS ENUM('pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."tenant_role" AS ENUM('tenant_admin', 'academic_leader', 'faculty', 'consultant', 'student', 'staff');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text,
	"actor_uid" text NOT NULL,
	"actor_membership_id" uuid,
	"actor_role" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb,
	"request_id" text,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"domain" text NOT NULL,
	"touches_enrollment_or_grading" boolean DEFAULT false NOT NULL,
	"human_approval_gate_passed" boolean DEFAULT false NOT NULL,
	"human_disposition" text,
	"disposition_notes" text,
	"disposition_set_by" text,
	"disposition_set_at" timestamp with time zone,
	"recommended_action" text,
	"recommended_action_notes" text,
	"implementation_status" "decision_status" DEFAULT 'proposed' NOT NULL,
	"is_ai_drafted" boolean DEFAULT false NOT NULL,
	"generation_mode" text,
	"kernel_section_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnostic_items" (
	"id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"notes" text,
	"data_reference" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diagnostic_items_tenant_id_id_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "evidence_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"claim_text" text NOT NULL,
	"source_url" text NOT NULL,
	"source_name" text NOT NULL,
	"confidence_tier" text NOT NULL,
	"date_published" text NOT NULL,
	"date_added" text NOT NULL,
	"retraction_status" text DEFAULT 'active' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discipline" text,
	"program" text,
	"created_by_uid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_staging" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"claim_text" text NOT NULL,
	"source_url" text NOT NULL,
	"source_name" text NOT NULL,
	"confidence_tier" text NOT NULL,
	"date_published" text NOT NULL,
	"discovered_at" text NOT NULL,
	"status" "staging_status" DEFAULT 'pending_review' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_signoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"signoff_type" "signoff_type" NOT NULL,
	"body_name" text NOT NULL,
	"signer_uid" text,
	"signer_membership_id" uuid,
	"signed_by_name" text,
	"status" "signoff_status" NOT NULL,
	"resolution_notes" text DEFAULT '' NOT NULL,
	"signed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"endpoint" text NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"mission_statement" text NOT NULL,
	"governance_type" text NOT NULL,
	"academic_governance_type" text NOT NULL,
	"academic_governance_body_name" text NOT NULL,
	"provost_office_name" text NOT NULL,
	"accreditors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legal_jurisdiction" text NOT NULL,
	"budget_tier" text NOT NULL,
	"enrollment_size" integer NOT NULL,
	"student_demographics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_ai_policy_status" text NOT NULL,
	"primary_languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active_overlay_pack_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "tenant_role" NOT NULL,
	"title" text NOT NULL,
	"governing_body_affiliation" text NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by_uid" text,
	"accepted_by_uid" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"job_id" text PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"autonomy_level" text NOT NULL,
	"last_run_at" text NOT NULL,
	"next_run_due_at" text NOT NULL,
	"items_processed" integer DEFAULT 0 NOT NULL,
	"status" "job_status" DEFAULT 'idle' NOT NULL,
	"last_result_summary" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" text NOT NULL,
	"tenant_id" text NOT NULL,
	"role" "tenant_role" NOT NULL,
	"title" text NOT NULL,
	"governing_body_affiliation" text NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overlay_packs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"accreditation_frameworks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data_protection_regime" text NOT NULL,
	"languages_supported" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"regional_case_study_focus" text NOT NULL,
	"special_compliance_gates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"prediction_text" text NOT NULL,
	"made_by_user_id" text NOT NULL,
	"made_by_user_name" text NOT NULL,
	"made_by_role" text NOT NULL,
	"date_made" text NOT NULL,
	"target_date" text NOT NULL,
	"actual_outcome" text,
	"resolution_status" "prediction_status" DEFAULT 'pending' NOT NULL,
	"lessons_learned" text,
	"scope_level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_surveys" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"role" text NOT NULL,
	"discipline_or_program" text NOT NULL,
	"ai_usage_frequency" text NOT NULL,
	"primary_tools_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"perceived_academic_value" integer NOT NULL,
	"perceived_integrity_risk" integer NOT NULL,
	"comments" text DEFAULT '' NOT NULL,
	"created_by_uid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "red_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"institution_or_context" text NOT NULL,
	"case_summary" text NOT NULL,
	"source_url" text NOT NULL,
	"pattern_description" text NOT NULL,
	"warning_signs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mitigations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"date_reported" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"decision_id" text NOT NULL,
	"scenario_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"key_assumptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"non_tech_drivers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reversibility_rating" integer NOT NULL,
	"is_ai_drafted" boolean DEFAULT false NOT NULL,
	"generation_mode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shadow_ai_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"reported_by_role" text NOT NULL,
	"department_or_course" text NOT NULL,
	"tool_or_use_name" text NOT NULL,
	"description" text NOT NULL,
	"perceived_risk_type" text NOT NULL,
	"status" text DEFAULT 'flagged' NOT NULL,
	"action_taken" text,
	"created_by_uid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholder_impacts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"decision_id" text NOT NULL,
	"stakeholder_group" text NOT NULL,
	"benefit_description" text NOT NULL,
	"cost_description" text NOT NULL,
	"power_shift" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"uid" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_items" ADD CONSTRAINT "diagnostic_items_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_created_by_uid_users_uid_fk" FOREIGN KEY ("created_by_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_staging" ADD CONSTRAINT "evidence_staging_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_signoffs" ADD CONSTRAINT "governance_signoffs_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_signoffs" ADD CONSTRAINT "governance_signoffs_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_signoffs" ADD CONSTRAINT "governance_signoffs_signer_uid_users_uid_fk" FOREIGN KEY ("signer_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_signoffs" ADD CONSTRAINT "governance_signoffs_signer_membership_id_memberships_id_fk" FOREIGN KEY ("signer_membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_uid_users_uid_fk" FOREIGN KEY ("uid") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_surveys" ADD CONSTRAINT "pulse_surveys_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_surveys" ADD CONSTRAINT "pulse_surveys_created_by_uid_users_uid_fk" FOREIGN KEY ("created_by_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shadow_ai_reports" ADD CONSTRAINT "shadow_ai_reports_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shadow_ai_reports" ADD CONSTRAINT "shadow_ai_reports_created_by_uid_users_uid_fk" FOREIGN KEY ("created_by_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_impacts" ADD CONSTRAINT "stakeholder_impacts_tenant_id_institutions_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_impacts" ADD CONSTRAINT "stakeholder_impacts_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_tenant_created_idx" ON "audit_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "decisions_tenant_idx" ON "decisions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "evidence_claims_tenant_idx" ON "evidence_claims" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "evidence_staging_tenant_idx" ON "evidence_staging" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "governance_signoffs_decision_type_unique" ON "governance_signoffs" USING btree ("decision_id","signoff_type");--> statement-breakpoint
CREATE INDEX "governance_signoffs_tenant_idx" ON "governance_signoffs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idempotency_expires_idx" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_email_tenant_unique" ON "invites" USING btree ("email","tenant_id");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_uid_tenant_unique" ON "memberships" USING btree ("uid","tenant_id");--> statement-breakpoint
CREATE INDEX "memberships_tenant_idx" ON "memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "predictions_tenant_idx" ON "predictions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "pulse_surveys_tenant_idx" ON "pulse_surveys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scenarios_decision_idx" ON "scenarios" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "shadow_ai_reports_tenant_idx" ON "shadow_ai_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "stakeholder_impacts_decision_idx" ON "stakeholder_impacts" USING btree ("decision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));