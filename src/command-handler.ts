import { Env } from "./env";
import {
    APIApplicationCommand,
    APIChatInputApplicationCommandInteraction,
    APIInteractionResponse,
    APIInteractionResponseDeferredChannelMessageWithSource,
    InteractionResponseType,
    RESTPostAPIWebhookWithTokenJSONBody,
    Routes
} from "discord-api-types/v10";
import { fetcher } from "itty-fetcher";


// TODO: switch to itty-fetcher

export class CommandHandler {
    commands: Map<string, [
        APIApplicationCommand,
        (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<APIInteractionResponse>,
        ((message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<RESTPostAPIWebhookWithTokenJSONBody>)?
    ]>;
    api;

    constructor() {
        this.commands = new Map();
        this.api = fetcher({ base: 'https://discord.com/api/v10'});
    }

    addCommand(
        command: APIApplicationCommand,
        handler: (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<APIInteractionResponse>
    ): void;
    addCommand(
        command: APIApplicationCommand,
        handler: (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<APIInteractionResponseDeferredChannelMessageWithSource>,
        deferredHandler: (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<RESTPostAPIWebhookWithTokenJSONBody>
    ): void;

    addCommand(
        command: APIApplicationCommand,
        handler: (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<APIInteractionResponse | APIInteractionResponseDeferredChannelMessageWithSource>,
        deferredHandler?: (message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) => Promise<RESTPostAPIWebhookWithTokenJSONBody>
    ): void {
        this.commands.set(command.name.toLowerCase(), deferredHandler ? [command, handler, deferredHandler] : [command, handler]);
    }

    async registerCommands(discord_token: string, discord_application_id: string, guildId?: string | undefined) {
        const url = (guildId ? Routes.applicationGuildCommands(discord_application_id, guildId) : Routes.applicationCommands(discord_application_id));
        
        console.log(this.commands);
        const commands = Array.from(this.commands.values()).map(item => item[0]);
        console.log(commands);

        const response = await this.api.put(url, commands, {
            headers: {
                Authorization: `Bot ${discord_token}`,
            }
        })
        .then(response => 'Registered all commands\n\n' + JSON.stringify(response, null, 2))
        .catch(error => 'Error registering commands\n\n' + error);

        console.log(response);
        return response;
    }

    async handleDeferred(message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) {
        const url = Routes.webhookMessage(message.application_id, message.token, '@original');
        
        const name = message.data.name.toLowerCase();
        const command = this.commands.get(name)!;
        const deferredHandler = command[2]!;
        
        const deferredResponse = await deferredHandler(message, env, ctx);

        await this.api.patch(url, deferredResponse).then((response: any) => {
            console.log('response ', response);
        }).catch(({ status, error }) => {
            console.error(`Error Edit Original Interaction Response ${status}: ${error}`);
        });
    }

    async handleInteraction(message: APIChatInputApplicationCommandInteraction, env: Env, ctx: ExecutionContext) {
        const name = message.data.name.toLowerCase();
        const command = this.commands.get(name);
        if (!command) {
            console.log(`Unknown command ${name}`);
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: { content: 'Unknown command' }
            } as APIInteractionResponse;
        }

        const handler = command[1];
        const deferredHandler = command[2];

        deferredHandler && ctx.waitUntil(this.handleDeferred(message, env, ctx));

        return await handler(message, env, ctx);
    }
}
