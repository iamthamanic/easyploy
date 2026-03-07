/**
 * @easyploy/stack-supabase — Kong config for API gateway.
 */

export function renderKongYml(): string {
  return `_format_version: "2.1"
_transform: true

services:
  - name: auth
    url: http://api:9999
    routes:
      - name: auth
        paths:
          - /auth/v1
  - name: rest
    url: http://rest:3000
    routes:
      - name: rest
        paths:
          - /rest/v1
`
}
