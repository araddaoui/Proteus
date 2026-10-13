# Proteus Preview, Demo & Security Notice

**Operator:** Ali Raddaoui, doing business as "Proteus"
**Effective Date:** [EFFECTIVE DATE] · **Version:** 1.0

Please read this before using any Proteus preview, demo, or beta feature.

## 1. This Is Not a Secured Production Environment

Preview and demo features are demonstrations of how Proteus works. They are **not** certified, audited, or production-grade controls.

## 2. The Identity Selector Is Not Secure Authentication

The persona/custom-identity selector lets you **preview** the product as different roles. It is **not** a secure login:

- anyone can select any role, with no verification;
- identity tokens are generated on the client and are not cryptographically secure; and
- do not treat a preview identity as proof of who someone is, or as authorization to access real data.

Institutional single sign-on is on the roadmap. Until it is announced, treat all preview identities as unverified.

## 3. Synthetic Data Only

**Do not enter real student, employee, applicant, or institutional data, or any personal or confidential information about an identifiable person.** Preview data is stored in your own browser and is not protected.

## 4. Where Your Data Goes

- Preview/demo working data is stored **in your browser** (local storage), not in a persistent server-side customer database.
- Typical requests are handled by our hosting provider (Vercel), which processes technical/log data.
- If you sign in with Google, Google processes your sign-in identity (Firebase).
- If AI features are enabled, the text you submit is processed by a third-party model provider (currently Google Gemini when configured).

## 5. No Warranty, Advisory Only

Everything Proteus produces in preview is **advisory only** and may be wrong. Do not rely on it for any real decision. See the AI Output & Decision-Making Disclaimer.

## 6. Report Problems

To report a security concern or a suspected misuse, contact **araddaoui@gmail.com**.

## 7. Governing Terms

This Notice is part of, and incorporated into, the Proteus Terms of Service.
