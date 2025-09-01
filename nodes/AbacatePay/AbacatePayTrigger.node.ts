import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';

import {
	extractWebhookData,
	formatAmount,
	calculateNetAmount,
	getDocumentType,
	getEmailDomain,
	parseFullName,
} from './triggers/shared/webhook-helpers';

import {
	getAllTriggerEvents,
	determineResourceType,
	normalizeEventType,
} from './triggers/shared/trigger-utils';

export class AbacatePayTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AbacatePay Trigger',
		name: 'abacatePayTrigger',
		icon: 'file:abacate.svg',
		group: ['trigger'],
		version: 1,
		description: 'Integre em tempo real a AbacatePay para eventos de pagamentos PIX, cobranças, clientes, cupons e saques',
		defaults: {
			name: 'AbacatePay Trigger',
		},
		inputs: [] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: getAllTriggerEvents(),
				default: ['pix.payment.completed', 'billing.paid'],
				description: 'Eventos que devem disparar o webhook',
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
				description: 'Método de autenticação para validar webhooks',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
				description: 'Nome de usuário para autenticação básica',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				displayOptions: {
					show: {
						authentication: ['basicAuth'],
					},
				},
				description: 'Senha para autenticação básica',
			},
			{
				displayName: 'Header Name',
				name: 'headerName',
				type: 'string',
				default: 'Authorization',
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
				description: 'Nome do cabeçalho de autenticação',
			},
			{
				displayName: 'Header Value',
				name: 'headerValue',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				displayOptions: {
					show: {
						authentication: ['headerAuth'],
					},
				},
				description: 'Valor do cabeçalho de autenticação',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();

		// Get node parameters
		const events = this.getNodeParameter('events') as string[];
		const authentication = this.getNodeParameter('authentication') as string;

		// Validate authentication if enabled
		if (authentication === 'basicAuth') {
			const username = this.getNodeParameter('username') as string;
			const password = this.getNodeParameter('password') as string;

			const authHeader = headerData.authorization as string;
			if (!authHeader || !authHeader.startsWith('Basic ')) {
				return { noWebhookResponse: true };
			}

			const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
			if (credentials !== `${username}:${password}`) {
				return { noWebhookResponse: true };
			}
		} else if (authentication === 'headerAuth') {
			const headerName = this.getNodeParameter('headerName') as string;
			const headerValue = this.getNodeParameter('headerValue') as string;

			const requestHeaderValue = headerData[headerName.toLowerCase()] as string;
			if (requestHeaderValue !== headerValue) {
				return { noWebhookResponse: true };
			}
		}

		// Extract and normalize webhook data
		const { data, eventType } = extractWebhookData(bodyData);

		// Determine resource type and normalize event using modular functions
		const resourceType = determineResourceType(data);
		const normalizedEvent = normalizeEventType(resourceType, data, eventType);

		// Filter by selected events
		if (events.length > 0 && !events.includes(normalizedEvent)) {
			return { noWebhookResponse: true };
		}

		// Prepare enriched output data
		let outputData: any = {
			...data,
			event: normalizedEvent,
			resourceType,
			timestamp: new Date().toISOString(),
			headers: headerData,
		};

		// Add enriched data based on resource type
		if (data.amount) {
			outputData.amounts = {
				raw: data.amount,
				reais: formatAmount(data.amount as number),
				fee: data.platformFee || 0,
				feeReais: formatAmount((data.platformFee as number) || 0),
				net: calculateNetAmount(data.amount as number, (data.platformFee as number) || 0),
				netReais: formatAmount(calculateNetAmount(data.amount as number, (data.platformFee as number) || 0)),
			};
		}

		// Customer data enrichment
		if (data.name || data.email || data.taxId) {
			const customerData: any = {};

			if (data.name) {
				customerData.name = parseFullName(data.name as string);
			}

			if (data.email) {
				const email = data.email as string;
				customerData.email = {
					address: email,
					domain: getEmailDomain(email),
				};
			}

			if (data.taxId) {
				const taxId = data.taxId as string;
				customerData.document = {
					type: getDocumentType(taxId),
					raw: taxId,
					cleaned: taxId.replace(/[^\d]/g, ''),
				};
			}

			outputData.customer = customerData;
		}

		// Status flags
		outputData.status = {
			isPaid: data.status === 'PAID',
			isExpired: data.status === 'EXPIRED',
			isCancelled: data.status === 'CANCELLED',
			isRefunded: data.status === 'REFUNDED',
			isPending: data.status === 'PENDING',
			isComplete: data.status === 'COMPLETE',
		};

		return {
			workflowData: [
				[
					{
						json: outputData,
					},
				],
			],
		};
	}
}
