/* =====================================================================
   ZICA CREATIVE QUEST — config.js   ← the ONLY file you edit on GitHub
   ---------------------------------------------------------------------
   Leave SUPABASE_URL empty  → the site runs in DEMO mode (works instantly,
                                nothing is saved, the OTP code is shown on screen).
   Fill both values          → LIVE mode (Supabase saves everything).

   Both values come from Supabase → Project Settings → API:
     SUPABASE_URL       "Project URL"            e.g. https://abcdxyz.supabase.co
     SUPABASE_ANON_KEY  "anon public" key, or the "Publishable" key (sb_publishable_…)
   The anon/publishable key is MEANT to be public. Never paste the service_role / secret key here.
   ===================================================================== */
window.CQ_CONFIG = {
  SUPABASE_URL: 'https://elrgbounsplqheblmvaa.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscmdib3Vuc3BscWhlYmxtdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTQyNTIsImV4cCI6MjEwODUzMDI1Mn0.UsIiV3Fy1UajAPBcXrLPj3gMpPfck2DuvGZ9FJCNZ_o',
  FUNCTION_NAME: 'quest',
  FUNCTION_REGION: 'ap-south-1', // same region as the database (Mumbai)
  FUNCTION_URL: '',            // optional override (only for local testing)

  /* Defaults used instantly on page load (the live database Settings override them). */
  DEFAULTS: {
    title: 'ZICA Creative Quest',
    tagline: 'Your imagination. Your next move.',
    intro: 'Think like an animator. See like a VFX artist. Discover what you could create.',
    institute: 'ZICA Pune · Kothrud',
    logoUrl: 'assets/img/logo.png',
    avatarNameUrl: 'assets/img/avatar-hello.png',
    avatarContactUrl: 'assets/img/avatar-point.png',
    avatarCertUrl: 'assets/img/avatar-certificate.png',
    trophyUrl: '',
    bgImageUrl: '',
    courses: ['UI/UX Design', 'Game Art & Design', '3D Animation & VFX', 'Film Making & VFX', 'Motion Graphics & Editing', 'Graphic Design', 'Digital Design & Marketing', 'Product Visualisation & Ad Design', 'Architectural Design & Animation', 'Digital Photography', 'Creative Gen AI', 'Not sure yet'],
    countryCode: '91',
    totalQuestions: 25,
    requireName: true,
    marketingPreticked: true,   // updates checkbox starts ticked (they can untick)
    rewardText: 'Free introductory lessons in animation, VFX, gaming & design',
    eligibilityNote: '',
    privacyUrl: '',
    contactLine: 'ZICA Pune, Kothrud',
    hasLanding: false,
    waAvailable: false,
    otpChannel: 'email',
    cert: {
      enabled: true,
      title: 'Certificate of Completion',
      presented: 'This certificate is proudly presented to',
      body: 'for successfully completing the ZICA Creative Quest — an interactive exploration of animation, VFX, gaming, design and filmmaking.',
      showScore: false,
      theme: 'light',
      bgUrl: 'assets/img/certificate-bg.jpg',
      logoUrl: 'assets/img/logo.png',
      signatureUrl: 'assets/img/signature.png',
      signatoryName: 'Pallavi Shivarkar',
      signatoryTitle: 'Managing Director',
      instituteLine: 'ZICA Pune · Kothrud'
    }
  }
};
