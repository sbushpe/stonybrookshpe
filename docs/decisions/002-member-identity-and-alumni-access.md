# 002. Member identity and alumni access

2026-08-26 · Accepted (implementation deferred)

## Context

`member-sign-in.html` requires an SBU address: the email field carries `data-sbu-email`, and
`shpe.js` rejects anything not ending in `@stonybrook.edu`, case-insensitively. The address is
not just a contact field, it is the proof of student status. Requiring it is what lets a
magic link double as roster verification without the chapter building an identity check of
its own (ADR 001, engineering-rules §6.1).

That check is deliberately strict, and it rejects `@alumni.stonybrook.edu`. The obvious
reading is that alumni were overlooked. They were not, and the subdomain is a red herring:
**alumni do not get SBU addresses.** Loosening the pattern to accept
`*.stonybrook.edu` would buy nothing real and would weaken the one signal the check exists
to carry.

The underlying problem is real, though, and it arrives on a schedule. A member's SBU
address stops working after they graduate. An account keyed solely on that address dies with
it, which is the opposite of what the chapter wants: `contact-us.html` invites alumni to
mentor, host workshops, and stay in the loop, and the resume book's value depends on members
still being reachable in the months around graduation, exactly when the address is expiring.

## Decision

**Accounts stay keyed on the SBU email. A member profile carries a second, verified backup
email, and once an SBU address stops working the backup becomes the address a sign-in link
is sent to.**

The domain check on sign-up does not move. A new account still has to prove student status
with a live `@stonybrook.edu` address, so the front door is unchanged.

Constraints for whoever builds it:

- **The backup email is verified before it is usable.** An unverified recovery address is an
  account-takeover path, not a convenience. It gets its own confirmation round trip, and it
  cannot receive a sign-in link until it is confirmed.
- **Changing the backup email is confirmed from the address currently on file**, so
  compromising one session is not enough to redirect a member's future sign-ins.
- **It is optional and member-set,** from the portal. Nobody is forced to hand over a
  personal address to stay a member.
- **It counts as PII** under engineering-rules §7.3: minimum collection is satisfied because
  it serves a live feature (continuity of access), it stays out of logs, and account deletion
  removes it along with everything else.
- **Sponsors never see it.** It is an authentication detail, not directory data, and it must
  not appear in any sponsor-facing response regardless of tier.

## Consequences

**What this buys us:** membership survives graduation, so the alumni pipeline the chapter
already advertises has somewhere to land. The student-status check stays strict, which keeps
the magic link meaningful. And the fix is additive, one nullable column and a verification
flow, rather than a rework of how sign-in works.

**What it costs:** a second address per profile is more personal data to protect, and a
recovery path is a genuine attack surface that has to be built carefully rather than quickly.
The sign-in flow gains a branch (which address does this link go to?), and account deletion
gains a field it must not miss.

**What would make us revisit:** Stony Brook issuing addresses that survive graduation, which
would make the whole problem disappear; or the chapter moving to Google OAuth as the primary
sign-in, which would shift the question from "which address" to "which Google account" and
deserve its own ADR.

**Until it is built:** a graduating member loses access when their SBU address stops
resolving. That is a known, accepted gap, not a bug to be patched by loosening the domain
check.
