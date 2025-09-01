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
import { extractWebhookData, validateWebhookData, formatAmount, calculateNetAmount } from '../shared/webhook-helpers';

export class AbacatePayPixTrigger implements INodeType {
	description = createBaseTriggerDescription({
		displayName: 'AbacatePay PIX Trigger',
		name: 'abacatePayPixTrigger',
		description: 'Escuta eventos relacionados a pagamentos PIX da AbacatePay',
		webhookPath: 'abacatepay-pix',
		defaultName: 'AbacatePay PIX Trigger',
		events: [
			{
				name: 'PIX Payment Completed',
				value: 'pix.payment.completed',
				description: 'Quando um pagamento PIX é concluído',
			},
			{
				name: 'PIX Payment Expired',
				value: 'pix.payment.expired',
				description: 'Quando um QR Code PIX expira',
			},
			{
				name: 'PIX Payment Failed',
				value: 'pix.payment.failed',
				description: 'Quando um pagamento PIX falha',
			},
			{
				name: 'PIX QR Code Created',
				value: 'pix.qrcode.created',
				description: 'Quando um QR Code PIX é criado',
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

		// Validate this is PIX data
		if (!validateWebhookData(data, ['brCode', 'amount', 'status']) && 
		    !validateWebhookData(data, ['id', 'amount'])) {
			return createNoWebhookResponse();
		}

		// Determine event type based on status
		let normalizedEvent = eventType;
		if (data.status === 'PAID') {
			normalizedEvent = 'pix.payment.completed';
		} else if (data.status === 'EXPIRED') {
			normalizedEvent = 'pix.payment.expired';
		} else if (data.status === 'CANCELLED' || data.status === 'FAILED') {
			normalizedEvent = 'pix.payment.failed';
		} else if (data.status === 'PENDING') {
			normalizedEvent = 'pix.qrcode.created';
		}

		// Filter by selected events
		if (!events.includes(normalizedEvent)) {
			return createNoWebhookResponse();
		}

		// Enrich PIX data
		const enrichedData = {
			...data,
			event: normalizedEvent,
			resourceType: 'pix',
			timestamp: new Date().toISOString(),
			
			// PIX-specific enrichments
			payment: {
				status: {
					isPaid: data.status === 'PAID',
					isExpired: data.status === 'EXPIRED',
					isFailed: data.status === 'CANCELLED' || data.status === 'FAILED',
					isPending: data.status === 'PENDING',
				},
				amounts: data.amount ? {
					raw: data.amount,
					reais: formatAmount(data.amount as number),
					fee: data.platformFee || 0,
					feeReais: formatAmount((data.platformFee as number) || 0),
					net: calculateNetAmount(data.amount as number, (data.platformFee as number) || 0),
					netReais: formatAmount(calculateNetAmount(data.amount as number, (data.platformFee as number) || 0)),
				} : undefined,
				qrCode: {
					id: data.id,
					brCode: data.brCode,
					hasQrImage: !!data.brCodeBase64,
				},
			},
		};

		return createSuccessResponse(enrichedData);
	}
}
