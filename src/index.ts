/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { AutoRouter, json } from "itty-router";
import { Env } from "./env";
import { APIChatInputApplicationCommandInteraction, APIPingInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { commandHandler } from './commands';

const router = AutoRouter();

router.get('/setup', async (request, env: Env, ctx: ExecutionContext) => {
	return new Response(await commandHandler.registerCommands(env.DISCORD_TOKEN, env.DISCORD_APPLICATION_ID, undefined));
	// return await register(env);
});

router.post('/interaction', async (request, env: Env, ctx: ExecutionContext) => {
	const signature = request.headers.get('X-Signature-Ed25519');
	const timestamp = request.headers.get('X-Signature-Timestamp');
	const body = await request.clone().arrayBuffer();
	const isValidRequest = signature && timestamp && (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!isValidRequest) {
		console.error('Invalid Request');
		return new Response('Bad request signature.', { status: 401 });
	}

	const message: APIPingInteraction | APIChatInputApplicationCommandInteraction = await request.json();
	console.log(message);
	if (message.type === InteractionType.Ping) {
		console.log('Handling Ping request');
		return json({ type: InteractionResponseType.Pong });
	}

	if (message.type === InteractionType.ApplicationCommand) {
		return json(await commandHandler.handleInteraction(message, env, ctx));
	}

	return json({ error: 'Unknown Type' }, { status: 400 });
});

router.get('/', (request, env: Env) => {
	// console.log(env.DISCORD_APPLICATION_ID);
	return new Response(`☝🤓 ${env.DISCORD_APPLICATION_ID}`)
});

router.all('*', () => new Response('Not Found 😱', { status: 404 }));

export default router;