import { Env } from "./env";
import { CommandHandler } from "./command-handler";
import {
    APIApplicationCommand,
    APIApplicationCommandInteractionDataAttachmentOption,
    APIApplicationCommandInteractionDataStringOption,
    APIChatInputApplicationCommandInteraction,
    APIInteractionResponse,
    APIInteractionResponseDeferredChannelMessageWithSource,
    ApplicationCommandOptionType,
    InteractionResponseType,
    MessageFlags,
    RESTPostAPIWebhookWithTokenJSONBody
} from "discord-api-types/v10";
import { error, json } from "itty-router";
import { ChatCCP } from "./chatccp";
import { Part } from "@google/generative-ai";
import { bufferToImagePart } from "./helpers";

export const commandHandler = new CommandHandler();

commandHandler.addCommand(
    {
        name: 'ping',
        description: 'respond pong',
    } as APIApplicationCommand,
    async (message) => {
        const interactionResponse: APIInteractionResponse = {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: { content: 'pong' }
        };
        return interactionResponse;
    }
);

// commandHandler.addCommand(
//     {
//         name: 'error',
//         description: 'test error',
//     } as APIApplicationCommand,
//     async (message) => {
//         return { error: 'test error' };
//     }
// );

// commandHandler.addCommand(
//     {
//         name: 'sleep_10s',
//         description: 'test defer interaction',
//     } as APIApplicationCommand,
//     async (message) => {
//         return {
//             type: InteractionResponseType.DeferredChannelMessageWithSource,
//             // data: { flags: MessageFlags.Loading } // optional
//         } as APIInteractionResponseDeferredChannelMessageWithSource;
//     },
//     async (message) => {
//         await new Promise(r => setTimeout(r, 10000));
//         console.log('woke up');
//         return {
//             content: 'slept 10s'
//         } as RESTPostAPIWebhookWithTokenJSONBody;
//     }
// );

commandHandler.addCommand(
    {
        name: 'ask',
        description: 'Ask ChatCCP',
        options: [
            {
                name: 'prompt',
                description: 'The prompt to ask ChatCCP',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            // {
            //     name: 'image',
            //     description: 'Add an image',
            //     type: ApplicationCommandOptionType.Attachment,
            //     content_type: 'image/*',
            //     required: false
            // }
        ]
    } as APIApplicationCommand,
    async (message): Promise<APIInteractionResponseDeferredChannelMessageWithSource> => {
        return { type: InteractionResponseType.DeferredChannelMessageWithSource };
    },
    async (message, env, ctx) => {
        try {
            const prompt = message.data.options!.find(option => option.name === 'prompt') as APIApplicationCommandInteractionDataStringOption;
            // const username = message.member?.user.global_name!;
            let request: string | Array<string | Part>;
            // const attachment: APIApplicationCommandInteractionDataAttachmentOption | undefined = message.data.options?.find(option => option.name === 'image') as APIApplicationCommandInteractionDataAttachmentOption;
            // const image_url = message.data.resolved?.attachments![attachment.value]?.url!;
            // if (image_url) {
            //     const image = await fetch(image_url);
            //     const arrayBuffer = await (await image.blob()).arrayBuffer();
            //     const imagePart = bufferToImagePart(arrayBuffer, image.headers.get('content-type')!);
            //     request = [prompt.value, imagePart];
            // } else {
                request = prompt.value;
            // }

            const chatCCP = new ChatCCP(env);
            await chatCCP.init();
            const response = await chatCCP.ask(request);

            const webhookBody: RESTPostAPIWebhookWithTokenJSONBody = {
                content: `> ${prompt.value}\n\n${response}`,
                // embeds: [
                //     {
                //         image: {
                //             url: image_url ?? '',
                //         }
                //     }
                // ]
            };
            return webhookBody;
        } catch (error) {
            const webhookBody: RESTPostAPIWebhookWithTokenJSONBody = {
                content: `${error}`,
            };
            return webhookBody;
        }
    }
);

