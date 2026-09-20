# Access control and RBAC

## Important boundary

A normal public GitHub Pages site cannot enforce a private allowlist or RBAC. A browser-only gate is not security because the built files are still publicly downloadable.

Eagle Eye therefore uses this deployment model:

```text
GitHub Actions -> GitHub Pages -> Cloudflare Access -> approved people
                                      |
                                      +-- GitHub OAuth / organization membership
                                      +-- role policies
```

## Recommended setup

1. Keep the repository private unless the dashboard itself is intended to be public.
2. Deploy the site with `.github/workflows/deploy.yml`.
3. Put a custom domain in front of the Pages site and proxy it through Cloudflare.
4. In Cloudflare Zero Trust, create an Access application for the dashboard hostname.
5. Add GitHub as an identity provider and restrict the policy to your GitHub organization.
6. Add individual users or teams to the organization. Removing a person from the organization removes dashboard access after their Access session expires.
7. Use separate Access policies for roles:
   - `Owner`: organization owners; full dashboard and administration access.
   - `Operator`: the observability team; dashboard, incidents, and collector operations.
   - `Viewer`: read-only dashboard and incident visibility.
8. Set session duration to a short operational window, enable MFA through the identity provider, and deny everyone else.

## API and collector authorization

The static dashboard must never contain vendor tokens. Run collectors and any future API behind a server-side service. Enforce the same role claims there:

- `Owner`: manage monitors, collectors, users, and routing rules.
- `Operator`: acknowledge incidents, edit monitors, and view evidence.
- `Viewer`: read-only access.

Validate the identity token server-side on every request. Do not trust a role stored in `localStorage`, query parameters, or client-rendered HTML.

## GitHub-only option

GitHub Enterprise Cloud can restrict Pages visibility for private repositories in supported organizations. If that feature is available to your organization, use GitHub organization membership as the allowlist and keep the repository private. For standard public GitHub Pages, use an access proxy such as Cloudflare Access; GitHub Pages alone cannot provide this control.
