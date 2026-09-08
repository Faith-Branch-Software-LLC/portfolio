import { NextResponse } from 'next/server';

// Served at https://faithbranch.com/.well-known/apple-app-site-association
// A route handler (rather than a static /public file) guarantees the
// correct Content-Type and no redirects regardless of hosting setup — both
// are hard requirements for Apple to accept it.
//
// Enables two things for the FaithBranchAdmin iOS app (see its
// `com.apple.developer.associated-domains` entitlement):
//  - webcredentials: 1Password / iCloud Keychain can match and suggest the
//    right saved login on the sign-in screen instead of listing every one.
export async function GET() {
  return NextResponse.json({
    webcredentials: {
      apps: ['78R6DF42SL.com.faithbranchsoftware.faithbranchadmin'],
    },
  });
}
