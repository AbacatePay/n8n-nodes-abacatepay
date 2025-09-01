import {
	INodeType,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { 
	createBaseTriggerDescription, 
	createNoWebhookResponse, 
	createSuccessResponse,
	authenticateWebhook,
} from '../shared/base-trigger';
import { extractWebhookData, validateWebhookData, getDocumentType, getEmailDomain, parseFullName } from '../shared/webhook-helpers';

export class AbacatePayCustomerTrigger implements INodeType {
	description = createBaseTriggerDescription({
		displayName: 'AbacatePay Customer Trigger',
		name: 'abacatePayCustomerTrigger',
		description: 'Escuta eventos relacionados a clientes da AbacatePay',
		webhookPath: 'abacatepay-customer',
		defaultName: 'AbacatePay Customer Trigger',
		events: [
			{
				name: 'Customer Created',
				value: 'customer.created',
				description: 'Quando um novo cliente é criado',
			},
			{
				name: 'Customer Updated',
				value: 'customer.updated',
				description: 'Quando os dados de um cliente são atualizados',
			},
		],
	});

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		
		// Get parameters
		const events = this.getNodeParameter('events') as string[];
		const authType = this.getNodeParameter('authentication') as string;
		const username = this.getNodeParameter('username', '') as string;
		const password = this.getNodeParameter('password', '') as string;
		const headerName = this.getNodeParameter('headerName', '') as string;
		const headerValue = this.getNodeParameter('headerValue', '') as string;

		// Authenticate if required
		if (!authenticateWebhook(this, authType, username, password, headerName, headerValue)) {
			return createNoWebhookResponse();
		}

		// Extract webhook data
		const { data, eventType } = extractWebhookData(bodyData);

		// Validate this is customer data
		if (!validateWebhookData(data, ['name', 'email', 'taxId', 'cellphone'])) {
			return createNoWebhookResponse();
		}

		// Determine event type
		let normalizedEvent = eventType;
		if (eventType.includes('update') || eventType.includes('edit')) {
			normalizedEvent = 'customer.updated';
		} else {
			normalizedEvent = 'customer.created';
		}

		// Filter by selected events
		if (!events.includes(normalizedEvent)) {
			return createNoWebhookResponse();
		}

		// Enrich customer data
		const enrichedData = {
			...data,
			event: normalizedEvent,
			resourceType: 'customer',
			timestamp: new Date().toISOString(),
			
			// Customer-specific enrichments
			customer: {
				name: parseFullName(data.name as string),
				email: {
					address: data.email as string,
					domain: getEmailDomain(data.email as string),
				},
				document: {
					type: getDocumentType(data.taxId as string),
					raw: data.taxId as string,
					cleaned: (data.taxId as string).replace(/[^\d]/g, ''),
				},
				cellphone: {
					raw: data.cellphone as string,
					cleaned: (data.cellphone as string).replace(/[^\d]/g, ''),
				},
			},
		};

		return createSuccessResponse(enrichedData);
	}
}
