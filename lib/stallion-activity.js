import { supabase } from './supabase';

export async function logStallionActivity({
  stallionId,
  eventType,
  sourceModule,
  reportType = null,
  summary = null,
  score = null,
  payload = {},
}) {
  const parsedStallionId = Number(stallionId);

  if (!Number.isFinite(parsedStallionId) || !eventType || !sourceModule) {
    return { success: false, error: 'INVALID_ACTIVITY_PAYLOAD' };
  }

  const { data: authData } = await supabase.auth.getSession();
  const userId = authData?.session?.user?.id;

  if (!userId) {
    return { success: false, error: 'NO_SESSION' };
  }

  const normalizedScore = Number(score);
  const { error } = await supabase.from('stallion_activity_log').insert([
    {
      user_id: userId,
      stallion_id: parsedStallionId,
      event_type: eventType,
      source_module: sourceModule,
      report_type: reportType,
      summary,
      score: Number.isFinite(normalizedScore) ? normalizedScore : null,
      payload: payload && typeof payload === 'object' ? payload : {},
    },
  ]);

  if (error) {
    console.error('stallion activity log error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
