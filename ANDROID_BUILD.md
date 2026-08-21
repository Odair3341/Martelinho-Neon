# 📱 App Android (Google Play) — Guia de Publicação

Este projeto agora pode ser empacotado como **app Android nativo** usando [Capacitor](https://capacitorjs.com) e publicado no **Google Play**.

## O que já está configurado

- ✅ **Capacitor + Android** instalados (`android/` folder)
- ✅ `applicationId`: `com.martelinho.oliveira` (permanente — não mudar após publicar)
- ✅ Nome do app: **Martelinho Gestão**
- ✅ Ícones de launcher gerados nas densidades mdpi→xxxhdpi (fundo branco + logo)
- ✅ Splash screen gerada (logo centralizado em fundo branco e escuro)
- ✅ Chamadas `/api/*` adaptadas para funcionar no app nativo via `VITE_API_BASE_URL`
- ✅ Workflow GitHub Actions para gerar o `.aab` automaticamente
- ✅ Signing config (assina quando `android/keystore.properties` existe)

## Arquitetura (como os dados funcionam)

O app **não guarda dados localmente** — ele é um "cliente" do mesmo backend:

```
App Android (WebView)
   │  HTTPS
   ▼
https://martelinho-neon.vercel.app/api/data   (definido em VITE_API_BASE_URL)
   │
   ▼
Neon Postgres (mesmos dados do site)
```

Ou seja: o app e o site mostram **sempre os mesmos dados**. Requer internet (como você escolheu).

---

## Segredos gerados (guardar em local seguro!)

A keystore de assinatura e as senhas foram geradas e ficam em:
- `android/release.keystore` (arquivo de assinatura — **gitignored, nunca commitar**)
- `android/keystore.properties` (senhas — **gitignored**)
- `android/keystore-info.txt` (resumo das senhas — **gitignored**)

> ⚠️ **CRÍTICO**: faça backup de `android/release.keystore` + `android/keystore.properties` em um
> local seguro (Google Drive, pendrive, cofre de senhas). Sem eles você **nunca mais**
> conseguirá publicar uma atualização do app na Play Store.

---

## Passo a passo para publicar

### 1. Commit e push das mudanças

```bash
git add -A
git commit -m "feat: app Android com Capacitor"
git push
```

> `android/release.keystore` e `android/keystore.properties` **não entram no Git** (estão no `.gitignore`).

### 2. Configurar os segredos no GitHub

No repositório (ex: `Odair3341/Martelinho-Neon`):

1. Vá em **Settings → Secrets and variables → Actions**
2. **Variables** → adicione:
   - `VITE_API_BASE_URL` = `https://martelinho-neon.vercel.app`
3. **Secrets → New repository secret** → adicione 4 segredos:

| Nome do segredo | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 android/release.keystore` (cole todo o texto) |
| `ANDROID_KEYSTORE_PASSWORD` | senha do `android/keystore-info.txt` |
| `ANDROID_KEY_ALIAS` | `martelinho` |
| `ANDROID_KEY_PASSWORD` | senha do `android/keystore-info.txt` (mesma da senha de store) |

### 3. Gerar o `.aab`

**Opção A — GitHub Actions (recomendado, sem instalar nada):**
1. Vá em **Actions → "Build Android AAB" → Run workflow → Run workflow**
2. Quando terminar, baixe o artefato `app-release-aab`

**Opção B — Localmente (precisa Android Studio/SDK e JDK 21):**
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
# resultado: android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Criar a ficha no Google Play Console

1. Acesse [play.google.com/console](https://play.google.com/console)
2. **Create app** → nome: **Martelinho Gestão**
3. **Main store listing**: preencha descrição, categoria, ícone (512×512 PNG) e screenshots (2–8)
4. **Data safety**: declare os dados coletados (nomes, e-mails, dados financeiros)
5. **Privacy policy URL**: precisa de uma URL pública (ex: GitHub Pages ou seu site)
6. **Test & release → Production → Create release** → upload do `app-release.aab`
7. Envie para revisão

### 5. Revisão e publicação

- A primeira revisão do Google leva de **algumas horas a ~7 dias**
- Depois de aprovado, o app aparece na Play Store

---

## Comandos úteis no dia a dia

```bash
# Desenvolvimento web (como sempre foi)
npm run dev

# Rebuild web + sincronizar com o app Android
npm run android:sync

# Regerar ícones/splash (edite assets/icon-only.png, assets/splash.png, assets/splash-dark.png antes)
npx capacitor-assets generate --android

# Testar no aparelho/emulador (Android Studio instalado)
npm run android:open
```

## Solução de problemas

| Problema | Causa provável | Solução |
|---|---|---|
| App abre e mostra "Falha ao conectar ao banco" | `VITE_API_BASE_URL` ausente/errada ou Vercel offline | Verifique `https://martelinho-neon.vercel.app/api/health` no navegador |
| Build falha com "SDK not found" | Sem Android SDK local | Use GitHub Actions (Opção A) |
| Build do Actions falha no `cap sync` | Falta `npm run build` | O workflow já roda o build; verifique o log |
| Google rejeita por login | Fluxo de login restrito a contas | Use canal "Internal testing" ou restrinja o público |
| Ícone aparece cortado | Logo fora da área segura | Regere os ícones com mais margem em `assets/icon-only.png` |
