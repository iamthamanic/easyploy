# SSH Deployment Test

## Test Setup

Da das Monorepo Build-Fehler hat (fehlende Workspace-Module), testen wir den SSH Provider separat:

```bash
# 1. Provider-Code ist TypeScript valide
npx tsc --noEmit src/providers/ssh.ts src/providers/types.ts
# ✅ Keine Fehler

# 2. Manuelle Test-Schritte (wenn Server verfügbar):

# Erstelle easyploy.config.json:
cat > easyploy.config.json <> EOF
{
  "host": "your-server.com",
  "user": "root",
  "privateKey": "~/.ssh/id_ed25519",
  "remotePath": "/opt/easyploy"
}
EOF

# Führe Deployment aus:
easyploy deploy --provider ssh

# Oder mit CLI-Optionen:
easyploy deploy --provider ssh --host your-server.com --user root --key ~/.ssh/id_ed25519
```

## Erwartetes Verhalten

1. **Build Phase**: Docker-Images werden lokal gebaut
2. **Copy Phase**: docker-compose.yml und .env werden auf Server kopiert
3. **Deploy Phase**: Services werden auf Remote-Server gestartet
4. **Ergebnis**: App läuft auf http://your-server.com:3000

## Architektur

- **SSHProvider**: Implementiert DeploymentProvider Interface
- **SOLID**: Single Responsibility - nur SSH-Deployment
- **Fehlerbehandlung**: Rollback möglich (TODO: implementieren)

## Bekannte Einschränkungen

- Monorepo Build hat Fehler (unabhängig von diesem Feature)
- SSH-Key muss manuell konfiguriert werden
- Kein automatisches Rollback bei Fehlern (nur Fehlermeldung)
