# Argora Token API
Argora Token API based on [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [x] RTC token
- [x] RTM token
- [x] max expirationTtl (24 hours)

## Dev
Start from this template repo

```bash
pnpm create cloudflare@latest --template jwhx/cloudflare-agora-api
```


```bash
pnpm run dev
```

## Deploy

```bash
pnpm run deploy
```
> [!IMPORTANT]
> Set the Secrets: `appID` and `appCertificate` as below
> ![Secrets.png](docs\Secrets.png)
