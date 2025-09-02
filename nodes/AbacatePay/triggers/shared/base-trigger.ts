import {
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
	INodeProperties,
} from 'n8n-workflow';

export interface ITriggerConfig {
	displayName: string;
	name: string;
	description: string;
	webhookPath: string;
	defaultName: string;
	events: Array<{ name: string; value: string; description?: string }>;
}

export function createBaseTriggerDescription(config: ITriggerConfig): INodeTypeDescription {
	return {
		displayName: config.displayName,
		name: config.name,
		icon: 'file:abacate.svg',
		group: ['trigger'],
		version: 1,
		description: config.description,
		defaults: {
			name: config.defaultName,
		},
		inputs: [] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: config.webhookPath,
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: config.events,
				default: [],
				description: 'Selecione os eventos que devem disparar o trigger',
				required: true,
			},
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Basic Auth',
						value: 'basicAuth',
					},
					{
						name: 'Header Auth',
						value: 'headerAuth',
					},
				],
				default: 'none',
				description: 'Como autenticar o webhook',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				description: 'Nome de usuário para Basic Auth',
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Senha para Basic Auth',
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
			},
			{
				displayName: 'Header Name',
				name: 'headerName',
				type: 'string',
				default: 'Authorization',
				description: 'Nome do header para autenticação',
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
			},
			{
				displayName: 'Header Value',
				name: 'headerValue',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Valor do header para autenticação',
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
			},
		] as INodeProperties[],
	};
}

export function createNoWebhookResponse(): IWebhookResponseData {
	return {
		noWebhookResponse: true,
	};
}

export function createSuccessResponse(data: any): IWebhookResponseData {
	return {
		workflowData: [
			[
				{
					json: data,
				},
			],
		],
	};
}

export function authenticateWebhook(
	webhookFunctions: IWebhookFunctions,
	authType: string,
	username?: string,
	password?: string,
	headerName?: string,
	headerValue?: string,
): boolean {
	if (authType === 'none') {
		return true;
	}

	const headers = webhookFunctions.getHeaderData();

	if (authType === 'basicAuth') {
		if (!username || !password) return false;
		
		const authHeader = headers.authorization as string;
		if (!authHeader || !authHeader.startsWith('Basic ')) return false;
		
		const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
		const [receivedUsername, receivedPassword] = credentials.split(':');
		
		return receivedUsername === username && receivedPassword === password;
	}

	if (authType === 'headerAuth') {
		if (!headerName || !headerValue) return false;
		
		const receivedValue = headers[headerName.toLowerCase()];
		return receivedValue === headerValue;
	}

	return false;
}
