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
import { extractWebhookData, validateWebhookData, formatAmount } from '../shared/webhook-helpers';

export class AbacatePayBillingTrigger implements INodeType {
	description = createBaseTriggerDescription({
		displayName: 'AbacatePay Billing Trigger',
		name: 'abacatePayBillingTrigger',
		description: 'Escuta eventos relacionados a cobranças da AbacatePay',
		webhookPath: 'abacatepay-billing',
		defaultName: 'AbacatePay Billing Trigger',
		events: [
			{
				name: 'Billing Created',
				value: 'billing.created',
				description: 'Quando uma nova cobrança é criada',
			},
			{
				name: 'Billing Paid',
				value: 'billing.paid',
				description: 'Quando uma cobrança é paga',
			},
			{
				name: 'Billing Expired',
				value: 'billing.expired',
				description: 'Quando uma cobrança expira',
			},
			{
				name: 'Billing Cancelled',
				value: 'billing.cancelled',
				description: 'Quando uma cobrança é cancelada',
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

		// Validate this is billing data
		if (!validateWebhookData(data, ['url', 'products']) && 
		    !validateWebhookData(data, ['id', 'status', 'frequency'])) {
			return createNoWebhookResponse();
		}

		// Determine event type based on status
		let normalizedEvent = eventType;
		if (data.status === 'PAID') {
			normalizedEvent = 'billing.paid';
		} else if (data.status === 'EXPIRED') {
			normalizedEvent = 'billing.expired';
		} else if (data.status === 'CANCELLED') {
			normalizedEvent = 'billing.cancelled';
		} else {
			normalizedEvent = 'billing.created';
		}

		// Filter by selected events
		if (!events.includes(normalizedEvent)) {
			return createNoWebhookResponse();
		}

		// Calculate total amount from products
		let totalAmount = 0;
		if (data.products && Array.isArray(data.products)) {
			totalAmount = (data.products as any[]).reduce((sum, product) => {
				return sum + (product.price * product.quantity);
			}, 0);
		}

		// Enrich billing data
		const enrichedData = {
			...data,
			event: normalizedEvent,
			resourceType: 'billing',
			timestamp: new Date().toISOString(),
			
			// Billing-specific enrichments
			billing: {
				status: {
					isPaid: data.status === 'PAID',
					isExpired: data.status === 'EXPIRED',
					isCancelled: data.status === 'CANCELLED',
					isPending: data.status === 'PENDING',
				},
				frequency: data.frequency,
				isRecurring: data.frequency === 'MULTIPLE_PAYMENTS',
				products: {
					count: data.products ? (data.products as any[]).length : 0,
					total: totalAmount,
					totalReais: formatAmount(totalAmount),
				},
				urls: {
					billing: data.url,
					return: data.returnUrl,
					completion: data.completionUrl,
				},
			},
		};

		return createSuccessResponse(enrichedData);
	}
}
