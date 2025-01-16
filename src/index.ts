/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token'

type Role = 'publisher' | 'subscriber'
interface TokenConfig {
	user: string;
	role: Role;
	channel: string;
	expirationTtl?: number;
	appID: string;
	appCertificate: string;
}



const generateRtcToken = (tokenConfig: TokenConfig) => {
	const { user: account, role: roleName, channel: channelName, expirationTtl, appID, appCertificate } = tokenConfig
	const role = roleName === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

	const expirationTimeInSeconds = expirationTtl || 3600 * 24

	const currentTimestamp = Math.floor(Date.now() / 1000)

	const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

	// IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.

	// Build token with uid
	// const rtcToken = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, expirationTimeInSeconds, privilegeExpiredTs);
	// console.log("Token With Integer Number Uid: " + rtcToken);

	// // Build token with user account
	const rtcToken = RtcTokenBuilder.buildTokenWithUserAccount(appID, appCertificate, channelName, account, role, expirationTimeInSeconds, privilegeExpiredTs);
	// console.log("Token With UserAccount: " + rtcToken);
	return rtcToken
}


const generateRtmToken = (tokenConfig: TokenConfig) => {
	const { user: account, expirationTtl, appID, appCertificate } = tokenConfig

	const expirationTimeInSeconds = expirationTtl || 3600 * 24
	const currentTimestamp = Math.floor(Date.now() / 1000)

	const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

	const token = RtmTokenBuilder.buildToken(appID, appCertificate, account, privilegeExpiredTs);
	// console.log("Rtm Token: " + token);

	return token
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const params = new URLSearchParams(url.search);

		const user = params.get('user') || 'anonymous';
		const role = params.get('role') as Role || 'publisher';
		const channel = params.get('channel') || 'ChatRoom';
		const appID = params.get('appID') || env.appID;
		const appCertificate = params.get('appCertificate') || env.appCertificate;

		const expirationTtl = 60 * 60 * 24
		const tokenConfig = {
			user,
			role,
			channel,
			expirationTtl,
			appID,
			appCertificate,
		}
		const commonConfig = {
			user,
			role,
			channel,
			expirationTtl,
			customAppCert: appID !== env.appID
		}

		const RTC_TOKEN_KEY = `RTC_TOKEN:${user}:${role}:${channel}`
		const RTM_TOKEN_KEY = `RTM_TOKEN:${user}:${role}:${channel}`

		let RTC_TOKEN = await env.Agora.get(RTC_TOKEN_KEY)
		let RTM_TOKEN = await env.Agora.get(RTM_TOKEN_KEY)

		const options = {
			expirationTtl,
			metadata: commonConfig
		}
		const updateOps = []

		if (!RTC_TOKEN) {
			RTC_TOKEN = generateRtcToken(tokenConfig)
			updateOps.push(env.Agora.put(RTC_TOKEN_KEY, RTC_TOKEN, options))
		}
		if (!RTM_TOKEN) {
			RTM_TOKEN = generateRtmToken(tokenConfig)
			updateOps.push(env.Agora.put(RTM_TOKEN_KEY, RTM_TOKEN, options))
		}

		await Promise.allSettled(updateOps)

		return new Response(JSON.stringify({
			RTC_TOKEN,
			RTM_TOKEN,
			config: commonConfig,
		}),
			{
				headers: {
					'content-type': 'application/json',
				},
			});
	},
} satisfies ExportedHandler<Env>;
