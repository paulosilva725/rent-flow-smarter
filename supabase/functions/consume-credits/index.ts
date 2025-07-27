import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONSUME-CREDITS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all active subscriptions that need credit consumption
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from("system_subscriptions")
      .select("*")
      .eq("status", "active")
      .gt("credits", 0);

    if (subscriptionsError) {
      logStep("Error fetching subscriptions", { error: subscriptionsError });
      throw subscriptionsError;
    }

    logStep("Found active subscriptions", { count: subscriptions?.length || 0 });

    const now = new Date();
    let processedCount = 0;
    let blockedCount = 0;

    for (const subscription of subscriptions || []) {
      const creditsUpdatedAt = new Date(subscription.credits_updated_at || subscription.created_at);
      const daysSinceLastUpdate = Math.floor((now.getTime() - creditsUpdatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      logStep("Processing subscription", { 
        owner_id: subscription.owner_id, 
        credits: subscription.credits,
        daysSinceLastUpdate 
      });

      // If 30 days have passed, consume 1 credit
      if (daysSinceLastUpdate >= 30) {
        const newCredits = Math.max(0, subscription.credits - 1);
        const newStatus = newCredits === 0 ? "expired" : "active";
        const isBlocked = newCredits === 0;

        // Update subscription
        const { error: updateError } = await supabaseClient
          .from("system_subscriptions")
          .update({
            credits: newCredits,
            status: newStatus,
            is_blocked: isBlocked,
            block_reason: isBlocked ? "Créditos esgotados" : null,
            credits_updated_at: now.toISOString()
          })
          .eq("id", subscription.id);

        if (updateError) {
          logStep("Error updating subscription", { error: updateError });
          continue;
        }

        // Record credit consumption transaction
        const { error: transactionError } = await supabaseClient
          .from("credit_transactions")
          .insert({
            owner_id: subscription.owner_id,
            subscription_id: subscription.id,
            credit_amount: -1,
            transaction_type: "monthly_consumption",
            description: "Consumo automático mensal (30 dias)"
          });

        if (transactionError) {
          logStep("Error recording transaction", { error: transactionError });
        }

        processedCount++;
        if (isBlocked) {
          blockedCount++;
          logStep("Subscription blocked due to no credits", { owner_id: subscription.owner_id });
        }

        logStep("Credit consumed", { 
          owner_id: subscription.owner_id, 
          newCredits, 
          newStatus, 
          isBlocked 
        });
      }
    }

    logStep("Function completed", { 
      totalSubscriptions: subscriptions?.length || 0,
      processedCount,
      blockedCount 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      processedCount,
      blockedCount,
      message: `Processed ${processedCount} subscriptions, ${blockedCount} blocked`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in consume-credits", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});