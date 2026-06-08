const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key
const supabase = createClient(
  'https://inbwimykrvmxhlmwxamk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluYndpbXlrcnZteGhsbXd4YW1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ5MzY1MSwiZXhwIjoyMDgxMDY5NjUxfQ.EEncizYr07qEr_WShCjsrRkGbGqMsUAvgrpzoigC8YE'
);

async function testDashboard() {
  console.log('🔍 Testing Customer Success Dashboard Service...');
  
  try {
    // Test fetching post-onboarding customers directly
    const { data: customers, error: customersError } = await supabase
      .from('cs_customer_post_onboarding')
      .select('*')
      .order('transferred_from_onboarding_at', { ascending: false });

    if (customersError) {
      console.error('❌ Customers query error:', customersError);
      return;
    }

    console.log('✅ Found customers:', customers.length);
    customers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.customer_email} - Health: ${customer.health_score}, Risk: ${customer.churn_risk_level}`);
    });

    // Test fetching communications
    const { data: emails, error: emailsError } = await supabase
      .from('cs_email_sends')
      .select('*');

    console.log('📧 Emails found:', emails?.length || 0);

    const { data: sms, error: smsError } = await supabase
      .from('cs_sms_logs')
      .select('*');

    console.log('📱 SMS found:', sms?.length || 0);

    const { data: calls, error: callsError } = await supabase
      .from('cs_call_logs')
      .select('*');

    console.log('📞 Calls found:', calls?.length || 0);

    console.log('\n✅ Database seeding verification complete!');
    console.log('The dashboard should now have data to display.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboard();