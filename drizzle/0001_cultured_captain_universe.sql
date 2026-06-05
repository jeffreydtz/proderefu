CREATE INDEX "matches_kickoff_idx" ON "matches" USING btree ("kickoff");--> statement-breakpoint
CREATE INDEX "matches_stage_idx" ON "matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "matches_group_idx" ON "matches" USING btree ("group_letter");--> statement-breakpoint
CREATE INDEX "predictions_match_idx" ON "predictions" USING btree ("match_id");