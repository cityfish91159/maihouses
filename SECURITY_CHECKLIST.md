# Security Checklist

## 0. Security Owner
- [ ] Assigned Owner: (Your Name Here)
- [ ] Responsibility: Check this list before every major release.

## 1. Secrets Management
- [ ] **Repo Check**: No `.env` files committed.
- [ ] **Repo Check**: No API keys, tokens, or passwords in code.
- [ ] **Vercel**: All secrets moved to Vercel Environment Variables.
- [ ] **Frontend**: Only `NEXT_PUBLIC_` / `VITE_` variables are exposed if absolutely necessary.

## 2. Database Security (Supabase)
- [ ] **RLS Enabled**: Row Level Security enabled on all user-data tables.
- [ ] **Policies**:
    - [ ] Users can only view/edit their own data.
    - [ ] Agents can only view their own listings/leads.
    - [ ] Public data (e.g., feed) is explicitly allowed for all.
- [ ] **API Access**: No direct DB access from frontend without RLS.

## 3. Frontend Security
- [ ] **Input Validation**: All inputs have `maxLength` and type checks.
- [ ] **XSS Prevention**: No `dangerouslySetInnerHTML` without sanitization.
- [ ] **Iframe Sandbox**: All iframes have `sandbox` attributes.
- [ ] **Error Handling**: No stack traces or raw error details shown to users.

## 4. Dependencies
- [ ] **Audit**: Run `npm audit` regularly.
- [ ] **Updates**: Keep critical dependencies updated.
- [ ] **GitHub**: Enable Dependabot and Security Alerts.

## 5. Logging
- [ ] **No PII**: Do not log full names, emails, phones, or IDs.
- [ ] **No Secrets**: Do not log tokens or keys.
